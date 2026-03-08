from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TextNoteCreate(BaseModel):
    content: str
    page: Optional[str] = None
    section: Optional[str] = None
    isPrivate: bool = True


class NotePublic(BaseModel):
    id: str
    bookId: str
    userId: str
    type: str
    content: Optional[str] = None
    audioUrl: Optional[str] = None
    page: Optional[str] = None
    section: Optional[str] = None
    isPrivate: bool
    createdAt: datetime


class NotesListResponse(BaseModel):
    items: list[NotePublic]
    total: int
