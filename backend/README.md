# Books Library Backend

## Run
1. Create virtual environment and activate it.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and update values.
4. Run migrations:
   - `alembic upgrade head`
5. Start server:
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## One-Command Startup (Docker Compose)
From repository root:
- `docker compose up --build`

This starts:
- `postgres` on `localhost:5432`
- `api` on `http://localhost:8000`

Migrations run automatically when API container starts.

## Default Admin
- Email: `admin@local`
- Password: `admin123`

## Notes
- Default DB is PostgreSQL.
- Storage folders are auto-created under `./storage`.
- OCR uses Tesseract via `pytesseract`.
- Install Tesseract binary on OS and ensure it is in PATH.
