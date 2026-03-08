from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "member"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    isActive: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    isActive: bool
    createdAt: datetime


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
