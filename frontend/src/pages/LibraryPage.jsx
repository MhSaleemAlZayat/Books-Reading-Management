import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { listBooks } from '../lib/api'

function LibraryPage() {
  const [books, setBooks] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    listBooks()
      .then((response) => setBooks(response.items || []))
      .catch((loadError) => setError(loadError.message || 'Failed to load books'))
  }, [])

  return (
    <div>
      <PageHeader
        action={
          <Link
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900"
            to="/books/new"
          >
            Add Book
          </Link>
        }
        subtitle="Manage ebooks and physical books in one catalog"
        title="Library"
      />

      <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-4">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          placeholder="Search title or author"
        />
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800">
          <option>All Types</option>
          <option>Ebook</option>
          <option>Physical</option>
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800">
          <option>All Categories</option>
          <option>Software Engineering</option>
          <option>Self Development</option>
          <option>Productivity</option>
        </select>
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Apply Filters
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr className="border-t border-slate-100 dark:border-slate-700" key={book.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{book.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">{book.author}</p>
                </td>
                <td className="px-4 py-3 capitalize dark:text-slate-200">{book.type}</td>
                <td className="px-4 py-3 dark:text-slate-200">{book.category}</td>
                <td className="px-4 py-3 dark:text-slate-200">{book.progress}%</td>
                <td className="px-4 py-3">
                  <Link
                    className="rounded-md bg-brand-100 px-3 py-1.5 font-medium text-brand-900"
                    to={`/books/${book.id}`}
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export default LibraryPage
