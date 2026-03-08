from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Book, BookFile, Note, Snapshot, User
from app.db.session import get_db

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/books/{file_name}")
def get_book_file(
    file_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_entry = db.scalar(select(BookFile).where(BookFile.file_name == file_name))
    if not file_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    book = db.get(Book, file_entry.book_id)
    if not book or (book.owner_id != current_user.id and current_user.role.value != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    path = Path(file_entry.file_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File missing")
    return FileResponse(path=path, media_type=file_entry.mime_type, filename=file_entry.file_name)


@router.get("/voice-notes/{file_name}")
def get_voice_note_file(
    file_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notes = list(db.scalars(select(Note).where(Note.audio_path.is_not(None))))
    note = next((item for item in notes if Path(item.audio_path).name == file_name), None)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    book = db.get(Book, note.book_id)
    if not book or (book.owner_id != current_user.id and current_user.role.value != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    path = Path(note.audio_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File missing")
    return FileResponse(path=path)


@router.get("/snapshots/{file_name}")
def get_snapshot_file(
    file_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    snapshots = list(db.scalars(select(Snapshot)))
    item = next((snap for snap in snapshots if Path(snap.image_path).name == file_name), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    book = db.get(Book, item.book_id)
    if not book or (book.owner_id != current_user.id and current_user.role.value != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    path = Path(item.image_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File missing")
    return FileResponse(path=path)
