from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refreshToken: str


class LogoutRequest(BaseModel):
    refreshToken: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    role: str
    isActive: bool


class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: int
    user: UserPublic


class RefreshResponse(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: int
