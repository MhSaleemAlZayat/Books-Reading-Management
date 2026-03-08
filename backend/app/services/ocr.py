from pathlib import Path

from PIL import Image
import pytesseract
from sqlalchemy.orm import Session

from app.db.models import OcrStatus, Snapshot


def run_ocr_job(db: Session, snapshot_id: str) -> None:
    snapshot = db.get(Snapshot, snapshot_id)
    if not snapshot:
        return

    snapshot.ocr_status = OcrStatus.processing
    db.commit()
    db.refresh(snapshot)

    try:
        image_path = Path(snapshot.image_path)
        if not image_path.exists():
            raise FileNotFoundError(snapshot.image_path)

        with Image.open(image_path) as image:
            extracted = pytesseract.image_to_string(image)

        snapshot.ocr_text = extracted.strip()
        snapshot.ocr_status = OcrStatus.completed
    except Exception as exc:  # noqa: BLE001
        snapshot.ocr_status = OcrStatus.failed
        snapshot.ocr_text = f"OCR failed: {exc}"
    finally:
        db.commit()
