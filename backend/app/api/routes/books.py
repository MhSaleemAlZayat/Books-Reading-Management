from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Book, BookFile, BookType, User
from app.db.session import get_db
from app.schemas.books import (
    BookCreate,
    BookDetailsResponse,
    BookPublic,
    BooksListResponse,
    BookUpdate,
    FilePublic,
)
from app.services.storage import BOOKS_DIR, remove_file, save_upload

router = APIRouter(prefix="/books", tags=["books"])


def map_file(model: BookFile | None) -> FilePublic | None:
    if not model:
        return None
    return FilePublic(
        id=model.id,
        fileName=model.file_name,
        mimeType=model.mime_type,
        sizeBytes=model.size_bytes,
        downloadUrl=f"/api/files/books/{model.file_name}",
    )


def map_book(book: Book) -> BookPublic:
    return BookPublic(
        id=book.id,
        title=book.title,
        author=book.author,
        type=book.type.value,
        category=book.category,
        language=book.language,
        format=book.format,
        shelf=book.shelf,
        ownerId=book.owner_id,
        progressPercent=book.progress_percent,
        hasFile=book.file is not None,
        createdAt=book.created_at,
        updatedAt=book.updated_at,
    )


@router.get("", response_model=BooksListResponse)
def list_books(
    q: str | None = Query(default=None),
    type: str | None = Query(default=None),
    category: str | None = Query(default=None),
    author: str | None = Query(default=None),
    language: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Book).where(Book.owner_id == current_user.id)
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Book.title.ilike(like)) | (Book.author.ilike(like)))
    if type in ("ebook", "physical"):
        stmt = stmt.where(Book.type == BookType(type))
    if category:
        stmt = stmt.where(Book.category == category)
    if author:
        stmt = stmt.where(Book.author.ilike(f"%{author}%"))
    if language:
        stmt = stmt.where(Book.language == language)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(
        db.scalars(
            stmt.order_by(Book.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize)
        )
    )

    return BooksListResponse(
        items=[map_book(item) for item in items],
        total=total,
        page=page,
        pageSize=pageSize,
    )


@router.get("/{book_id}", response_model=BookDetailsResponse)
def get_book(book_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book or (book.owner_id != current_user.id and current_user.role.value != "admin"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    return BookDetailsResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        type=book.type.value,
        category=book.category,
        language=book.language,
        format=book.format,
        shelf=book.shelf,
        ownerId=book.owner_id,
        progressPercent=book.progress_percent,
        tags=[],
        file=map_file(book.file),
        createdAt=book.created_at,
        updatedAt=book.updated_at,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_book(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content_type = (request.headers.get("content-type") or "").lower()
    file: UploadFile | None = None

    if content_type.startswith("application/json"):
        payload = BookCreate.model_validate(await request.json())
        title = payload.title
        author = payload.author
        type = payload.type
        category = payload.category
        language = payload.language
        format = payload.format
        shelf = payload.shelf
    else:
        form = await request.form()
        title = str(form.get("title", "")).strip()
        author = str(form.get("author", "")).strip()
        type = str(form.get("type", "")).strip()
        category = str(form.get("category", "")).strip() or None
        language = str(form.get("language", "")).strip() or None
        format = str(form.get("format", "")).strip() or None
        shelf = str(form.get("shelf", "")).strip() or None
        uploaded = form.get("file")
        if uploaded is not None and hasattr(uploaded, "filename") and hasattr(uploaded, "file"):
            file = uploaded

    if not title or not author or type not in ("ebook", "physical"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid input")

    book = Book(
        title=title,
        author=author,
        type=BookType(type),
        category=category,
        language=language,
        format=format,
        shelf=shelf,
        owner_id=current_user.id,
    )
    db.add(book)
    db.commit()
    db.refresh(book)

    if file:
        file_name, file_path, size = save_upload(file, BOOKS_DIR)
        db_file = BookFile(
            book_id=book.id,
            file_name=file_name,
            file_path=file_path,
            mime_type=file.content_type or "application/octet-stream",
            size_bytes=size,
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "type": book.type.value,
        "category": book.category,
        "language": book.language,
        "format": book.format,
        "shelf": book.shelf,
        "ownerId": book.owner_id,
        "createdAt": book.created_at,
    }


@router.patch("/{book_id}")
def update_book(
    book_id: str,
    payload: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    for field in ("title", "author", "category", "language", "format", "shelf"):
        value = getattr(payload, field)
        if value is not None:
            setattr(book, field, value)

    db.commit()
    db.refresh(book)
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "type": book.type.value,
        "category": book.category,
        "language": book.language,
        "format": book.format,
        "shelf": book.shelf,
        "updatedAt": book.updated_at,
    }


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    if book.file:
        remove_file(book.file.file_path)
        db.delete(book.file)
    db.delete(book)
    db.commit()
    return None


@router.post("/{book_id}/file")
def upload_book_file(
    book_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    if book.file:
        remove_file(book.file.file_path)
        db.delete(book.file)
        db.commit()

    file_name, file_path, size = save_upload(file, BOOKS_DIR)
    db_file = BookFile(
        book_id=book.id,
        file_name=file_name,
        file_path=file_path,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size,
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return {
        "bookId": book.id,
        "file": {
            "id": db_file.id,
            "fileName": db_file.file_name,
            "mimeType": db_file.mime_type,
            "sizeBytes": db_file.size_bytes,
            "downloadUrl": f"/api/files/books/{db_file.file_name}",
        },
        "updatedAt": book.updated_at,
    }
