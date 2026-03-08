import { useEffect, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import { listBooks, listBookSnapshots, listNotes } from '../lib/api'

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function DashboardPage() {
  const [books, setBooks] = useState([])
  const [notes, setNotes] = useState([])
  const [snapshotsCount, setSnapshotsCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listBooks(), listNotes()])
      .then(async ([booksResponse, notesResponse]) => {
        const items = booksResponse.items || []
        setBooks(items)
        setNotes(notesResponse.items || [])

        const snapshotsByBook = await Promise.all(
          items.map(async (book) => {
            const response = await listBookSnapshots(book.id)
            return (response.items || []).length
          }),
        )
        setSnapshotsCount(snapshotsByBook.reduce((sum, next) => sum + next, 0))
      })
      .catch((loadError) => setError(loadError.message || 'Failed to load dashboard data'))
  }, [])

  const ebooks = books.filter((book) => book.type === 'ebook').length
  const physicalBooks = books.filter((book) => book.type === 'physical').length

  return (
    <div>
      <PageHeader
        subtitle="Quick view of your library activity"
        title="Dashboard"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Books" value={books.length} />
        <StatCard label="Ebooks" value={ebooks} />
        <StatCard label="Physical Books" value={physicalBooks} />
        <StatCard label="Snapshots" value={snapshotsCount} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Continue Reading</h3>
          <ul className="mt-3 space-y-2">
            {books.map((book) => (
              <li className="rounded-md bg-slate-50 p-3" key={book.id}>
                <p className="font-medium text-slate-900">{book.title}</p>
                <p className="text-sm text-slate-500">{book.progress}% completed</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Notes</h3>
          <ul className="mt-3 space-y-2">
            {notes.map((note) => (
              <li className="rounded-md bg-slate-50 p-3" key={note.id}>
                <p className="text-sm font-semibold uppercase text-brand-700">{note.type} note</p>
                <p className="mt-1 text-sm text-slate-800">{note.content}</p>
                <p className="mt-1 text-xs text-slate-500">{note.createdAt}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export default DashboardPage
