# BooksLib

BooksLib is a local-network library system for:
- Ebooks (PDF/EPUB)
- Physical books
- Notes (text + voice)
- Snapshots with OCR
- Multi-user access over LAN (local machine as server)

It includes:
- React + Tailwind frontend
- FastAPI backend
- PostgreSQL database
- Docker Compose setup for one-command startup

## Project Structure
- `frontend/` React web app
- `backend/` FastAPI API + Alembic migrations
- `docker-compose.yml` API + Postgres services
- Planning/spec docs:
  - `BUSINESS.md`
  - `UI_UX_PLAN.md`
  - `UI_UX_EXECUTION_PLAN.md`
  - `FRONTEND_BUILD_PLAN.md`
  - `BACKEND_PLAN.md`
  - `BACKEND_API_SPEC.md`
  - `RUNNING_STEPS.md`

## Quick Start (Recommended)
From project root:

```bash
docker compose up -d --build
```

Open:
- API health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

## Frontend Run
From `frontend/`:

```bash
npm install
npm run dev
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Frontend URL:
- `http://localhost:5173`

## Login
Default admin account:
- Email: `admin@local`
- Password: `admin123`

## Current Reader Features
- Fullscreen mode
- Floating Quick Note panel
  - Expand / Collapse / Hide
  - Draggable
  - Reset panel position
- PDF controls (single merged toolbar with SVG icons):
  - Previous/Next page
  - Zoom in/out
  - Fit display / Fit single page
  - Display position (left/center/right)
  - Go to page input

## Upload + OCR Workflow
- Drag-and-drop upload for PDF/EPUB/snapshots
- Upload progress bars in frontend
- OCR endpoint for snapshot text extraction
- Voice note upload for page/section notes

### Reader Keyboard Shortcuts (PDF)
- `+` / `=`: Zoom in
- `-`: Zoom out
- `ArrowLeft`: Previous page
- `ArrowRight`: Next page
- `Alt+1`: Align left
- `Alt+2`: Align center
- `Alt+3`: Align right
- `Alt+D`: Fit display
- `Alt+S`: Fit single page
- `Ctrl/Cmd+G`: Focus go-to-page input
- `F`: Toggle fullscreen

## Data Persistence
Data is persisted across container restarts:
- PostgreSQL data in Docker volume: `bookslib_pg_data`
- Uploaded files in host folder: `backend/storage`

Data is removed only if you explicitly remove volumes or storage files:
- `docker compose down -v` (removes DB volume)
- deleting `backend/storage`

## Common Commands
```bash
docker compose ps
docker compose logs -f api
docker compose logs -f postgres
docker compose up -d --build api
docker compose down
```
