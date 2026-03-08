import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { searchAll } from '../lib/api'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [bookResults, setBookResults] = useState([])
  const [noteResults, setNoteResults] = useState([])
  const [snapshotResults, setSnapshotResults] = useState([])
  const [error, setError] = useState('')

  const runSearch = async () => {
    if (!query.trim()) {
      setBookResults([])
      setNoteResults([])
      setSnapshotResults([])
      return
    }

    try {
      setError('')
      const response = await searchAll(query.trim())
      setBookResults(response.books || [])
      setNoteResults(response.notes || [])
      setSnapshotResults(response.ocr || [])
    } catch (searchError) {
      setError(searchError.message || 'Search failed')
    }
  }

  return (
    <div>
      <PageHeader subtitle="Search books, notes, and OCR text" title="Search" />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') runSearch()
          }}
          placeholder="Try: clean code, chapter 2, meaningful names..."
          value={query}
        />
        <button
          className="mt-3 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          onClick={runSearch}
          type="button"
        >
          Search
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>

      {query.trim() ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">Books ({bookResults.length})</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {bookResults.map((book) => (
                <li key={book.bookId}>
                  <Link className="font-medium text-brand-900 hover:underline" to={`/books/${book.bookId}`}>
                    {book.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">Notes ({noteResults.length})</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {noteResults.map((note) => (
                <li key={note.noteId}>
                  <Link className="text-slate-800 hover:underline" to={`/books/${note.bookId}/notes`}>
                    {note.contentSnippet}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">OCR Text ({snapshotResults.length})</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {snapshotResults.map((snapshot) => (
                <li key={snapshot.snapshotId}>
                  <Link className="text-slate-800 hover:underline" to={`/books/${snapshot.bookId}/snapshots`}>
                    {snapshot.pageRef || snapshot.textSnippet}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default SearchPage
