# Code Review Issues

> Code review of the `main` branch conducted on 2026-03-08.
> Each issue below references the exact code location on `main` (commit `ddf6f2f`).
> Fixes for all items are included in PR [copilot/code-review-main-branch].

---

## Issue 1 — Security: Search endpoint leaks notes and snapshots across users

**Labels:** `security`, `bug`, `backend`

### Description

The search endpoint (`GET /api/search`) filters **books** by `owner_id`, but the **notes** and **snapshots** queries have no user-scoping at all. Any authenticated user can search across every user's private notes and OCR-extracted text.

### Affected Code

**File:** [`backend/app/api/routes/search.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/search.py)

**Line 40** — Notes query with no user filter:
```python
# backend/app/api/routes/search.py, line 40
matched_notes = list(db.scalars(select(Note).where(Note.content_text.ilike(q_like))))
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/search.py#L40

**Line 55** — Snapshots query with no user filter:
```python
# backend/app/api/routes/search.py, line 55
matched_snapshots = list(db.scalars(select(Snapshot).where(Snapshot.ocr_text.ilike(q_like))))
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/search.py#L55

Compare with the **books** query (line 26) which correctly filters:
```python
# backend/app/api/routes/search.py, line 29
Book.owner_id == current_user.id,
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/search.py#L26-L32

### Fix

Add `Note.user_id == current_user.id` and `Snapshot.user_id == current_user.id` to the respective queries.

---

## Issue 2 — Security: Path traversal vulnerability in file upload

**Labels:** `security`, `bug`, `backend`

### Description

The `save_upload` function constructs a file path from `settings.storage_path / folder / file_name` without validating that the resolved path stays within the storage directory. While the filename is a UUID (mitigating direct exploitation), there is no defensive check against path traversal — a crafted `folder` parameter or a symbolic-link attack could escape the storage root.

### Affected Code

**File:** [`backend/app/services/storage.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/services/storage.py)

**Lines 19–22** — Path constructed without validation:
```python
# backend/app/services/storage.py, lines 19-22
def save_upload(upload: UploadFile, folder: str) -> tuple[str, str, int]:
    ext = Path(upload.filename or "").suffix
    file_name = f"{uuid.uuid4()}{ext}"
    target = settings.storage_path / folder / file_name
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/services/storage.py#L19-L22

### Fix

Resolve both the storage root and the target path, then validate with `Path.is_relative_to()`:
```python
storage_root = settings.storage_path.resolve()
target = (storage_root / folder / file_name).resolve()
if not target.is_relative_to(storage_root):
    raise ValueError("Invalid file path")
```

### Additional Note

**Line 1** — Unused `import shutil` should be removed as a cleanup:
```python
# backend/app/services/storage.py, line 1
import shutil
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/services/storage.py#L1

---

## Issue 3 — Bug: Response body double-consume in frontend error handling

**Labels:** `bug`, `frontend`

### Description

In both `requestJson()` and the `login()` function, the error-handling code calls `response.json()` inside a `try` block and then `response.text()` in the `catch`. However, a `Response` body is a `ReadableStream` that can only be consumed once. If `response.json()` fails (e.g., non-JSON error response), the stream is already consumed and `response.text()` will return an empty string or throw.

### Affected Code

**File:** [`frontend/src/lib/api.js`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/frontend/src/lib/api.js)

**Lines 13–20** — `requestJson` error handling:
```javascript
// frontend/src/lib/api.js, lines 13-20
  if (!response.ok) {
    try {
      const json = await response.json()
      throw new Error(json?.error?.message || `Request failed: ${response.status}`)
    } catch {
      const text = await response.text()
      throw new Error(text || `Request failed: ${response.status}`)
    }
  }
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/frontend/src/lib/api.js#L13-L20

**File:** [`frontend/src/context/AuthContext.jsx`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/frontend/src/context/AuthContext.jsx)

**Lines 29–37** — `login` error handling:
```javascript
// frontend/src/context/AuthContext.jsx, lines 29-37
    if (!response.ok) {
      try {
        const json = await response.json()
        throw new Error(json?.error?.message || 'Login failed')
      } catch {
        const message = await response.text()
        throw new Error(message || 'Login failed')
      }
    }
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/frontend/src/context/AuthContext.jsx#L29-L37

### Fix

Read the body as text first, then try to parse it as JSON:
```javascript
if (!response.ok) {
  const text = await response.text()
  let message = `Request failed: ${response.status}`
  try {
    const json = JSON.parse(text)
    if (json?.error?.message) message = json.error.message
  } catch {
    if (text) message = text
  }
  throw new Error(message)
}
```

---

## Issue 4 — Performance: N+1 query pattern in file-serving endpoints

**Labels:** `performance`, `backend`

### Description

The `get_voice_note_file` and `get_snapshot_file` endpoints load **all** records from the database into memory, then filter in Python to find the one matching the filename. This is an O(N) full-table scan that gets worse as data grows.

### Affected Code

**File:** [`backend/app/api/routes/files.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/files.py)

**Lines 39–40** — Loads ALL voice notes into memory:
```python
# backend/app/api/routes/files.py, lines 39-40
    notes = list(db.scalars(select(Note).where(Note.audio_path.is_not(None))))
    note = next((item for item in notes if Path(item.audio_path).name == file_name), None)
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/files.py#L39-L40

**Lines 58–59** — Loads ALL snapshots into memory:
```python
# backend/app/api/routes/files.py, lines 58-59
    snapshots = list(db.scalars(select(Snapshot)))
    item = next((snap for snap in snapshots if Path(snap.image_path).name == file_name), None)
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/files.py#L58-L59

Compare with `get_book_file` (line 21) which correctly queries by filename:
```python
# backend/app/api/routes/files.py, line 21
    file_entry = db.scalar(select(BookFile).where(BookFile.file_name == file_name))
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/files.py#L21

### Fix

Use a targeted database query with an `endswith` filter instead of loading all records:
```python
note = db.scalar(
    select(Note).where(Note.audio_path.is_not(None), Note.audio_path.endswith(file_name))
)
```

---

## Issue 5 — Bug: Missing `progressPercent` in `BookDetailsResponse` schema

**Labels:** `bug`, `backend`

### Description

The `BookDetailsResponse` schema is missing the `progressPercent` field, even though `BookPublic` includes it. This means the book detail API response omits progress information, creating an inconsistency between list and detail views.

### Affected Code

**File:** [`backend/app/schemas/books.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/schemas/books.py)

**Lines 57–71** — `BookDetailsResponse` is missing `progressPercent`:
```python
# backend/app/schemas/books.py, lines 57-71
class BookDetailsResponse(BaseModel):
    id: str
    title: str
    author: str
    type: str
    category: Optional[str] = None
    language: Optional[str] = None
    format: Optional[str] = None
    shelf: Optional[str] = None
    ownerId: str
    tags: list[str]
    file: Optional[FilePublic] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/schemas/books.py#L57-L71

Compare with `BookPublic` which has the field (line 36):
```python
# backend/app/schemas/books.py, line 36
    progressPercent: int
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/schemas/books.py#L36

**File:** [`backend/app/api/routes/books.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/books.py)

**Lines 89–109** — `get_book` route also omits `progressPercent` from the response:
```python
# backend/app/api/routes/books.py, lines 95-109
    return BookDetailsResponse(
        id=book.id,
        title=book.title,
        ...
        ownerId=book.owner_id,
        tags=[],                     # <-- progressPercent missing here
        file=map_file(book.file),
        ...
    )
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/books.py#L89-L109

### Fix

Add `progressPercent: int = 0` to `BookDetailsResponse` and include `progressPercent=book.progress_percent` in the `get_book` route.

---

## Issue 6 — Performance: In-memory pagination loads all records

**Labels:** `performance`, `backend`

### Description

The `list_books` and `list_notes_global` endpoints load **all** matching records from the database into a Python list, then slice the list for pagination. This defeats the purpose of pagination — memory usage and query time grow linearly with total record count.

### Affected Code

**File:** [`backend/app/api/routes/books.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/books.py)

**Lines 76–79** — Books: loads all items then slices in Python:
```python
# backend/app/api/routes/books.py, lines 76-79
    all_items = list(db.scalars(stmt.order_by(Book.created_at.desc())))
    start = (page - 1) * pageSize
    end = start + pageSize
    items = all_items[start:end]
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/books.py#L76-L79

**File:** [`backend/app/api/routes/notes.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/notes.py)

**Lines 132–135** — Notes: loads all notes then slices in Python:
```python
# backend/app/api/routes/notes.py, lines 132-135
    all_notes = list(db.scalars(stmt.order_by(Note.created_at.desc())))
    start = (page - 1) * pageSize
    end = start + pageSize
    selected = all_notes[start:end]
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/api/routes/notes.py#L132-L135

### Fix

Use SQL `COUNT` for the total and `LIMIT`/`OFFSET` for the page:
```python
total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
items = list(db.scalars(stmt.order_by(...).offset((page - 1) * pageSize).limit(pageSize)))
```

---

## Issue 7 — Deprecated: `@app.on_event("startup")` should use lifespan

**Labels:** `maintenance`, `backend`

### Description

The application uses `@app.on_event("startup")` which is [deprecated in FastAPI](https://fastapi.tiangolo.com/advanced/events/#deprecation-warning). The recommended approach is to use the `lifespan` async context manager.

### Affected Code

**File:** [`backend/app/main.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/main.py)

**Lines 48–50** — Deprecated startup event:
```python
# backend/app/main.py, lines 48-50
@app.on_event("startup")
def on_startup() -> None:
    init_db()
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/main.py#L48-L50

### Fix

Replace with an async context manager lifespan:
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title=settings.app_name, lifespan=lifespan)
```

---

## Issue 8 — Cleanup: Unused `shutil` import in storage module

**Labels:** `cleanup`, `backend`

### Description

The `shutil` module is imported but never used anywhere in `storage.py`.

### Affected Code

**File:** [`backend/app/services/storage.py`](https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/services/storage.py)

**Line 1** — Unused import:
```python
# backend/app/services/storage.py, line 1
import shutil
```
https://github.com/MhSaleemAlZayat/Books-Reading-Management/blob/ddf6f2f5ea64862853e15e4d7ccc67a41a9dba12/backend/app/services/storage.py#L1

### Fix

Remove the unused import.
