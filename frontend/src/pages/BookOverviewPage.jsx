import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BookSubnav from '../components/books/BookSubnav'
import DropzoneUpload from '../components/common/DropzoneUpload'
import PageHeader from '../components/common/PageHeader'
import ProgressBar from '../components/common/ProgressBar'
import { getBook, uploadBookFile } from '../lib/api'

function BookOverviewPage() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')

  useEffect(() => {
    getBook(bookId)
      .then(setBook)
      .catch((loadError) => setError(loadError.message || 'Failed to load book'))
  }, [bookId])

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>
  }
  if (!book) {
    return <p className="text-sm text-slate-600">Loading book...</p>
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      setUploadProgress(0)
      setUploadStatus('Uploading ebook file...')
      await uploadBookFile(book.id, selectedFile, setUploadProgress)
      const refreshed = await getBook(book.id)
      setBook(refreshed)
      setSelectedFile(null)
      setUploadStatus('Ebook file uploaded.')
    } catch (uploadError) {
      setUploadStatus(uploadError.message || 'Upload failed.')
    }
  }

  return (
    <div>
      <PageHeader subtitle={`${book.author} • ${book.type}`} title={book.title} />
      <BookSubnav bookId={book.id} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Book Metadata</h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="text-slate-500">Category</dt>
              <dd className="font-medium text-slate-900">{book.category}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Language</dt>
              <dd className="font-medium text-slate-900">{book.language}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Format</dt>
              <dd className="font-medium text-slate-900">{book.format || 'Physical copy'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Shelf</dt>
              <dd className="font-medium text-slate-900">{book.shelf || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Progress and Tags</h3>
          <p className="mt-3 text-sm text-slate-700">Reading progress: {book.progressPercent || 0}%</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(book.tags || []).map((tag) => (
              <span
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                key={tag}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Ebook File</h3>
          <p className="mt-2 text-sm text-slate-600">
            {book.file?.fileName ? `Attached: ${book.file.fileName}` : 'No file attached yet.'}
          </p>
          <div className="mt-3">
            <DropzoneUpload
              accept=".pdf,.epub,application/pdf,application/epub+zip"
              label={selectedFile ? `Selected file: ${selectedFile.name}` : 'Drop PDF/EPUB file here'}
              onFileSelected={setSelectedFile}
            />
          </div>
          <button
            className="mt-3 rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-50"
            disabled={!selectedFile}
            onClick={handleUpload}
            type="button"
          >
            Upload File
          </button>
          {uploadProgress > 0 ? <ProgressBar value={uploadProgress} /> : null}
          {uploadStatus ? <p className="mt-2 text-sm text-emerald-600">{uploadStatus}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default BookOverviewPage
