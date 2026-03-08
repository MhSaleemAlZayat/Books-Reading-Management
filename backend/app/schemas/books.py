from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BookCreate(BaseModel):
    title: str
    author: str
    type: str
    category: Optional[str] = None
    language: Optional[str] = None
    format: Optional[str] = None
    shelf: Optional[str] = None


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    format: Optional[str] = None
    shelf: Optional[str] = None


class BookPublic(BaseModel):
    id: str
    title: str
    author: str
    type: str
    category: Optional[str] = None
    language: Optional[str] = None
    format: Optional[str] = None
    shelf: Optional[str] = None
    ownerId: str
    progressPercent: int
    hasFile: bool
    createdAt: datetime
    updatedAt: Optional[datetime] = None


class BooksListResponse(BaseModel):
    items: list[BookPublic]
    total: int
    page: int
    pageSize: int


class FilePublic(BaseModel):
    id: str
    fileName: str
    mimeType: str
    sizeBytes: int
    downloadUrl: str


class BookDetailsResponse(BaseModel):
    id: str
    title: str
    author: str
    type: str
    category: Optional[str] = None
    language: Optional[str] = None
    format: Optional[str] = None
    shelf: Optional[str] = None
    ownerId: str
    progressPercent: int = 0
    tags: list[str]
    file: Optional[FilePublic] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None
