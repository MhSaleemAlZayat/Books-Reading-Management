from fastapi import APIRouter

from app.api.routes import auth, books, files, notes, search, snapshots, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(books.router)
api_router.include_router(notes.router)
api_router.include_router(snapshots.router)
api_router.include_router(search.router)
api_router.include_router(files.router)
