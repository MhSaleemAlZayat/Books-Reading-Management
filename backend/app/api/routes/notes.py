from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Book, Note, NoteType, User
from app.db.session import get_db
from app.schemas.notes import NotePublic, NotesListResponse, TextNoteCreate
from app.services.storage import VOICE_DIR, save_upload

router = APIRouter(tags=["notes"])


def ensure_book_access(book_id: str, current_user: User, db: Session) -> Book:
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return book


def as_public(note: Note) -> NotePublic:
    return NotePublic(
        id=note.id,
        bookId=note.book_id,
        userId=note.user_id,
        type=note.type.value,
        content=note.content_text,
        audioUrl=f"/api/files/voice-notes/{note.audio_path.split('/')[-1]}" if note.audio_path else None,
        page=note.page_anchor,
        section=note.section_anchor,
        isPrivate=note.is_private,
        createdAt=note.created_at,
    )


@router.post("/books/{book_id}/notes", response_model=NotePublic, status_code=status.HTTP_201_CREATED)
def create_text_note(
    book_id: str,
    payload: TextNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_book_access(book_id, current_user, db)
    note = Note(
        book_id=book_id,
        user_id=current_user.id,
        type=NoteType.text,
        page_anchor=payload.page,
        section_anchor=payload.section,
        content_text=payload.content,
        is_private=payload.isPrivate,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return as_public(note)


@router.post("/books/{book_id}/voice-notes", response_model=NotePublic, status_code=status.HTTP_201_CREATED)
def create_voice_note(
    book_id: str,
    audio: UploadFile = File(...),
    page: str | None = Form(default=None),
    section: str | None = Form(default=None),
    isPrivate: bool = Form(default=True),  # noqa: N803
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_book_access(book_id, current_user, db)
    file_name, file_path, _size = save_upload(audio, VOICE_DIR)
    note = Note(
        book_id=book_id,
        user_id=current_user.id,
        type=NoteType.voice,
        page_anchor=page,
        section_anchor=section,
        audio_path=file_path,
        is_private=isPrivate,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return as_public(note)


@router.get("/books/{book_id}/notes", response_model=NotesListResponse)
def list_book_notes(
    book_id: str,
    type: str | None = Query(default=None),
    page: str | None = Query(default=None),
    section: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_book_access(book_id, current_user, db)
    stmt = select(Note).where(Note.book_id == book_id)
    if type in ("text", "voice"):
        stmt = stmt.where(Note.type == NoteType(type))
    if page:
        stmt = stmt.where(Note.page_anchor == page)
    if section:
        stmt = stmt.where(Note.section_anchor == section)
    notes = list(db.scalars(stmt.order_by(Note.created_at.desc())))
    return NotesListResponse(items=[as_public(n) for n in notes], total=len(notes))


@router.get("/notes", response_model=NotesListResponse)
def list_notes_global(
    q: str | None = Query(default=None),
    type: str | None = Query(default=None),
    bookId: str | None = Query(default=None),  # noqa: N803
    userId: str | None = Query(default=None),  # noqa: N803
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),  # noqa: N803
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Note)
    if current_user.role.value != "admin":
        stmt = stmt.where(Note.user_id == current_user.id)
    if q:
        stmt = stmt.where(Note.content_text.ilike(f"%{q}%"))
    if type in ("text", "voice"):
        stmt = stmt.where(Note.type == NoteType(type))
    if bookId:
        stmt = stmt.where(Note.book_id == bookId)
    if userId:
        stmt = stmt.where(Note.user_id == userId)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    selected = list(
        db.scalars(stmt.order_by(Note.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize))
    )
    return NotesListResponse(items=[as_public(n) for n in selected], total=total)
