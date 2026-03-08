import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { listBooks, listBookSnapshots } from '../lib/api'

function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    listBooks()
      .then(async (booksResponse) => {
        const bookItems = booksResponse.items || []
        const grouped = await Promise.all(
          bookItems.map(async (book) => {
            const response = await listBookSnapshots(book.id)
            return (response.items || []).map((snapshot) => ({
              ...snapshot,
              uploadedBy: snapshot.userId,
            }))
          }),
        )
        setSnapshots(grouped.flat())
      })
      .catch((loadError) => setError(loadError.message || 'Failed to load snapshots'))
  }, [])

  return (
    <div>
      <PageHeader subtitle="Uploaded page images and OCR status" title="Snapshots" />

      <div className="grid gap-3 md:grid-cols-2">
        {snapshots.map((snapshot) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4" key={snapshot.id}>
            <p className="font-semibold text-slate-900">{snapshot.pageRef}</p>
            <p className="mt-1 text-sm text-slate-600">Uploaded by: {snapshot.uploadedBy}</p>
            <p className="mt-2 text-sm text-slate-800">
              {snapshot.ocrText || 'OCR text is not available yet.'}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                OCR {snapshot.ocrStatus}
              </span>
              <Link
                className="text-sm font-semibold text-brand-900 hover:underline"
                to={`/books/${snapshot.bookId}/snapshots`}
              >
                Open Book
              </Link>
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export default SnapshotsPage
