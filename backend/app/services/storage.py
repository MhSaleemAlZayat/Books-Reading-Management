import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings

BOOKS_DIR = "books"
VOICE_DIR = "voice-notes"
SNAP_DIR = "snapshots"


def ensure_storage_dirs() -> None:
    for folder in (BOOKS_DIR, VOICE_DIR, SNAP_DIR):
        (settings.storage_path / folder).mkdir(parents=True, exist_ok=True)


def save_upload(upload: UploadFile, folder: str) -> tuple[str, str, int]:
    ext = Path(upload.filename or "").suffix
    file_name = f"{uuid.uuid4()}{ext}"
    target = (settings.storage_path / folder / file_name).resolve()

    # Ensure the resolved path stays within the storage directory
    if not str(target).startswith(str(settings.storage_path)):
        raise ValueError("Invalid file path")

    size = 0
    with target.open("wb") as out:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            out.write(chunk)

    return file_name, str(target), size


def remove_file(path: str | None) -> None:
    if not path:
        return
    file_path = Path(path)
    if file_path.exists():
        file_path.unlink()


def open_file(path: str) -> Path:
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(path)
    return file_path
