from pydantic import BaseModel


class SearchBookResult(BaseModel):
    bookId: str
    title: str
    author: str
    score: float


class SearchNoteResult(BaseModel):
    noteId: str
    bookId: str
    type: str
    contentSnippet: str
    page: str | None = None
    section: str | None = None
    score: float


class SearchOcrResult(BaseModel):
    snapshotId: str
    bookId: str
    pageRef: str | None = None
    textSnippet: str
    score: float


class SearchResponse(BaseModel):
    query: str
    books: list[SearchBookResult]
    notes: list[SearchNoteResult]
    ocr: list[SearchOcrResult]
