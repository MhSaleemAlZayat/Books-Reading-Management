from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SnapshotPublic(BaseModel):
    id: str
    bookId: str
    userId: str
    imageUrl: str
    pageRef: Optional[str] = None
    ocrStatus: str
    ocrText: str
    createdAt: datetime
    updatedAt: Optional[datetime] = None


class SnapshotListResponse(BaseModel):
    items: list[SnapshotPublic]
    total: int


class OcrStartResponse(BaseModel):
    snapshotId: str
    ocrStatus: str
    queuedAt: datetime


class OcrStatusResponse(BaseModel):
    snapshotId: str
    ocrStatus: str
    extractedText: str
    updatedAt: datetime
