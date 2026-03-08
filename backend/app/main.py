from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, select

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.security import hash_password
from app.db.models import User, UserRole
from app.db.session import SessionLocal, engine
from app.services.storage import ensure_storage_dirs

app = FastAPI(title=settings.app_name)
register_error_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def init_db() -> None:
    ensure_storage_dirs()
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        return

    db = SessionLocal()
    try:
        admin = db.scalar(select(User).where(User.email == "admin@local"))
        if not admin:
            admin = User(
                name="Admin",
                email="admin@local",
                password_hash=hash_password("admin123"),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.api_prefix)
