import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BookSubnav from '../components/books/BookSubnav'
import PageHeader from '../components/common/PageHeader'
import { getBook, listBookNotes } from '../lib/api'

function BookNotesPage() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [bookNotes, setBookNotes] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getBook(bookId), listBookNotes(bookId)])
      .then(([bookResponse, notesResponse]) => {
        setBook(bookResponse)
        setBookNotes(notesResponse.items || [])
      })
      .catch((loadError) => setError(loadError.message || 'Failed to load notes'))
  }, [bookId])

  if (error) return <p className="text-sm text-red-700">{error}</p>
  if (!book) return <p className="text-sm text-slate-600">Loading notes...</p>

  return (
    <div>
      <PageHeader subtitle="Text and voice notes by page or section" title={`${book.title} Notes`} />
      <BookSubnav bookId={book.id} />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
        <ul className="mt-3 space-y-3">
          {bookNotes.map((note) => (
            <li className="rounded-md border border-slate-200 p-3" key={note.id}>
              <p className="text-xs font-semibold uppercase text-brand-700">{note.type} note</p>
              <p className="mt-1 text-sm text-slate-800">{note.content || note.audioUrl || 'Voice note'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {note.page} - {note.section} - {note.createdAt}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default BookNotesPage
