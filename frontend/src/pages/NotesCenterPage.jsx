import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { listNotes } from '../lib/api'

function NotesCenterPage() {
  const [notes, setNotes] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    listNotes()
      .then((response) => setNotes(response.items || []))
      .catch((loadError) => setError(loadError.message || 'Failed to load notes'))
  }, [])

  return (
    <div>
      <PageHeader subtitle="All text and voice notes across the library" title="Notes Center" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Content</th>
              <th className="px-4 py-3">Anchor</th>
              <th className="px-4 py-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr className="border-t border-slate-100" key={note.id}>
                <td className="px-4 py-3 capitalize">{note.type}</td>
                <td className="px-4 py-3">{note.content || note.audioUrl || 'Voice note'}</td>
                <td className="px-4 py-3">
                  {note.page} - {note.section}
                </td>
                <td className="px-4 py-3">
                  <Link className="text-brand-900 hover:underline" to={`/books/${note.bookId}/notes`}>
                    Open Book Notes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export default NotesCenterPage
