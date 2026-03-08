import { useState } from 'react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import BookSubnav from '../components/books/BookSubnav'
import DropzoneUpload from '../components/common/DropzoneUpload'
import PageHeader from '../components/common/PageHeader'
import ProgressBar from '../components/common/ProgressBar'
import { getBook, getOcrStatus, listBookSnapshots, startOcr, uploadSnapshot } from '../lib/api'

function BookSnapshotsPage() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [pageRef, setPageRef] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [apiSnapshots, setApiSnapshots] = useState([])

  useEffect(() => {
    Promise.all([getBook(bookId), listBookSnapshots(bookId)])
      .then(([bookResponse, snapshotsResponse]) => {
        setBook(bookResponse)
        setApiSnapshots(snapshotsResponse.items || [])
      })
      .catch((error) => setUploadError(error.message || 'Failed to load snapshots'))
  }, [bookId])

  if (!book) return <p className="text-sm text-slate-600">Loading snapshots...</p>

  const bookSnapshots = apiSnapshots

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploadError('')
      setUploadStatus('Uploading snapshot...')
      setUploadProgress(0)
      const created = await uploadSnapshot(book.id, selectedFile, pageRef, setUploadProgress)
      setApiSnapshots((prev) => [
        ...prev,
        {
          id: created.id || `local-${Date.now()}`,
          bookId: book.id,
          pageRef: created.pageRef || pageRef || 'Uploaded page',
          userId: created.userId || 'current',
          ocrStatus: created.ocrStatus || 'Uploaded',
          ocrText: created.ocrText || '',
        },
      ])
      setUploadStatus('Snapshot uploaded.')
      setSelectedFile(null)
      setPageRef('')
    } catch (error) {
      setUploadStatus('')
      setUploadError(error.message || 'Upload failed.')
    }
  }

  const handleRunOcr = async (snapshotId) => {
    try {
      setUploadError('')
      setUploadStatus('Starting OCR...')
      await startOcr(snapshotId)

      for (let i = 0; i < 6; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const status = await getOcrStatus(snapshotId)
        setApiSnapshots((prev) =>
          prev.map((snapshot) =>
            snapshot.id === snapshotId
              ? {
                  ...snapshot,
                  ocrStatus: status.ocrStatus || snapshot.ocrStatus,
                  ocrText: status.extractedText || snapshot.ocrText,
                }
              : snapshot,
          ),
        )

        if (status.ocrStatus === 'Completed') break
      }

      setUploadStatus('OCR update received.')
    } catch (error) {
      setUploadStatus('')
      setUploadError(error.message || 'OCR request failed.')
    }
  }

  return (
    <div>
      <PageHeader subtitle="Page captures and OCR results" title={`${book.title} Snapshots`} />
      <BookSubnav bookId={book.id} />

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upload Snapshot</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
          <DropzoneUpload
            accept="image/*"
            label={selectedFile ? `Selected image: ${selectedFile.name}` : 'Drop snapshot image here'}
            onFileSelected={setSelectedFile}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            onChange={(event) => setPageRef(event.target.value)}
            placeholder="Page reference (ex: Page 41)"
            value={pageRef}
          />
          <button
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900"
            onClick={handleUpload}
            type="button"
          >
            Upload
          </button>
        </div>
        {uploadProgress > 0 ? <ProgressBar value={uploadProgress} /> : null}
        {uploadStatus ? <p className="mt-2 text-xs text-emerald-600">{uploadStatus}</p> : null}
        {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
      </div>

      <div className="grid gap-3">
        {bookSnapshots.map((snapshot) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900" key={snapshot.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{snapshot.pageRef}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  snapshot.ocrStatus?.toLowerCase() === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                OCR {snapshot.ocrStatus}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              {snapshot.ocrText || 'OCR still processing...'}
            </p>
            <button
              className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
              onClick={() => handleRunOcr(snapshot.id)}
              type="button"
            >
              Run OCR
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BookSnapshotsPage
