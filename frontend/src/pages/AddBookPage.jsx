import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DropzoneUpload from '../components/common/DropzoneUpload'
import PageHeader from '../components/common/PageHeader'
import ProgressBar from '../components/common/ProgressBar'
import { createBook, createBookWithFile } from '../lib/api'

function AddBookPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    author: '',
    type: 'ebook',
    category: '',
    language: '',
    format: 'PDF',
    shelf: '',
  })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('Saving book...')

    try {
      if (file) {
        setUploadProgress(0)
        await createBookWithFile(form, file, setUploadProgress)
      } else {
        await createBook(form)
      }
      setStatus('Book saved.')
      navigate('/library')
    } catch (saveError) {
      setStatus('')
      setError(saveError.message || 'Could not save book.')
    }
  }

  return (
    <div>
      <PageHeader subtitle="Add ebook or physical book to your library" title="Add Book" />

      <form
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">Title</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              onChange={updateField('title')}
              required
              value={form.title}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">Author</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              onChange={updateField('author')}
              required
              value={form.author}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">Type</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              onChange={updateField('type')}
              value={form.type}
            >
              <option value="ebook">Ebook</option>
              <option value="physical">Physical</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">Category</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              onChange={updateField('category')}
              value={form.category}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">Language</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              onChange={updateField('language')}
              value={form.language}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">Format</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              onChange={updateField('format')}
              value={form.format}
            >
              <option value="PDF">PDF</option>
              <option value="EPUB">EPUB</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm lg:col-span-2">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Shelf (Physical books)
            </span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              onChange={updateField('shelf')}
              placeholder="A2-03"
              value={form.shelf}
            />
          </label>

          <div className="lg:col-span-2">
            <DropzoneUpload
              accept=".pdf,.epub,application/pdf,application/epub+zip"
              label={file ? `Selected file: ${file.name}` : 'Upload ebook file (PDF/EPUB)'}
              onFileSelected={setFile}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900">
            Save Book
          </button>
          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        {uploadProgress > 0 ? <ProgressBar value={uploadProgress} /> : null}
      </form>
    </div>
  )
}

export default AddBookPage
