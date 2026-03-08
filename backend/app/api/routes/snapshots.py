from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Book, OcrStatus, Snapshot, User
from app.db.session import SessionLocal, get_db
from app.schemas.snapshots import OcrStartResponse, OcrStatusResponse, SnapshotListResponse, SnapshotPublic
from app.services.ocr import run_ocr_job
from app.services.storage import SNAP_DIR, save_upload

router = APIRouter(tags=["snapshots"])


def ensure_book_access(book_id: str, current_user: User, db: Session) -> Book:
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return book


def map_snapshot(snapshot: Snapshot) -> SnapshotPublic:
    return SnapshotPublic(
        id=snapshot.id,
        bookId=snapshot.book_id,
        userId=snapshot.user_id,
        imageUrl=f"/api/files/snapshots/{snapshot.image_path.split('/')[-1]}",
        pageRef=snapshot.page_ref,
        ocrStatus=snapshot.ocr_status.value,
        ocrText=snapshot.ocr_text or "",
        createdAt=snapshot.created_at,
        updatedAt=snapshot.updated_at,
    )


@router.post("/books/{book_id}/snapshots", response_model=SnapshotPublic, status_code=status.HTTP_201_CREATED)
def create_snapshot(
    book_id: str,
    image: UploadFile = File(...),
    pageRef: str | None = Form(default=None),  # noqa: N803
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_book_access(book_id, current_user, db)
    _name, path, _size = save_upload(image, SNAP_DIR)
    snapshot = Snapshot(
        book_id=book_id,
        user_id=current_user.id,
        image_path=path,
        page_ref=pageRef,
        ocr_status=OcrStatus.uploaded,
        ocr_text="",
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return map_snapshot(snapshot)


def _run_ocr_in_fresh_session(snapshot_id: str) -> None:
    db = SessionLocal()
    try:
        run_ocr_job(db, snapshot_id)
    finally:
        db.close()


@router.post("/snapshots/{snapshot_id}/ocr", response_model=OcrStartResponse, status_code=status.HTTP_202_ACCEPTED)
def start_ocr(
    snapshot_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    snapshot = db.get(Snapshot, snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")

    book = db.get(Book, snapshot.book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    if snapshot.ocr_status == OcrStatus.processing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="OCR already processing")

    snapshot.ocr_status = OcrStatus.processing
    db.commit()
    background_tasks.add_task(_run_ocr_in_fresh_session, snapshot_id)
    return OcrStartResponse(
        snapshotId=snapshot.id,
        ocrStatus=snapshot.ocr_status.value,
        queuedAt=datetime.now(timezone.utc),
    )


@router.get("/snapshots/{snapshot_id}/ocr-status", response_model=OcrStatusResponse)
def ocr_status(snapshot_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    snapshot = db.get(Snapshot, snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")
    book = db.get(Book, snapshot.book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    return OcrStatusResponse(
        snapshotId=snapshot.id,
        ocrStatus=snapshot.ocr_status.value,
        extractedText=snapshot.ocr_text or "",
        updatedAt=snapshot.updated_at,
    )


@router.get("/books/{book_id}/snapshots", response_model=SnapshotListResponse)
def list_book_snapshots(book_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_book_access(book_id, current_user, db)
    snapshots = list(
        db.scalars(select(Snapshot).where(Snapshot.book_id == book_id).order_by(Snapshot.created_at.desc()))
    )
    return SnapshotListResponse(items=[map_snapshot(item) for item in snapshots], total=len(snapshots))
