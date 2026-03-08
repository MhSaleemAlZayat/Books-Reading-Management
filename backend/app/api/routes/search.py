from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Book, Note, Snapshot, User
from app.db.session import get_db
from app.schemas.search import SearchBookResult, SearchNoteResult, SearchOcrResult, SearchResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def search_all(
    q: str = Query(..., min_length=1),
    type: str = Query(default="all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q_like = f"%{q}%"
    books: list[SearchBookResult] = []
    notes: list[SearchNoteResult] = []
    ocr: list[SearchOcrResult] = []

    if type in ("all", "books"):
        matched_books = list(
            db.scalars(
                select(Book).where(
                    Book.owner_id == current_user.id,
                    (Book.title.ilike(q_like) | Book.author.ilike(q_like) | Book.category.ilike(q_like)),
                )
            )
        )
        books = [
            SearchBookResult(bookId=item.id, title=item.title, author=item.author, score=0.9)
            for item in matched_books
        ]

    if type in ("all", "notes"):
        matched_notes = list(db.scalars(select(Note).where(Note.content_text.ilike(q_like))))
        notes = [
            SearchNoteResult(
                noteId=item.id,
                bookId=item.book_id,
                type=item.type.value,
                contentSnippet=(item.content_text or "")[:220],
                page=item.page_anchor,
                section=item.section_anchor,
                score=0.85,
            )
            for item in matched_notes
        ]

    if type in ("all", "ocr"):
        matched_snapshots = list(db.scalars(select(Snapshot).where(Snapshot.ocr_text.ilike(q_like))))
        ocr = [
            SearchOcrResult(
                snapshotId=item.id,
                bookId=item.book_id,
                pageRef=item.page_ref,
                textSnippet=(item.ocr_text or "")[:220],
                score=0.8,
            )
            for item in matched_snapshots
        ]

    return SearchResponse(query=q, books=books, notes=notes, ocr=ocr)
