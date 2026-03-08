import { useRef, useState } from 'react'

function DropzoneUpload({ accept, label, onFileSelected }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }

  const handleInputChange = (event) => {
    const file = event.target.files?.[0]
    if (file) onFileSelected(file)
  }

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-4 text-center text-sm transition ${
        isDragging
          ? 'border-brand-700 bg-brand-50 dark:bg-slate-800'
          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
      }`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="presentation"
    >
      <p className="text-slate-700 dark:text-slate-200">{label}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Drag and drop or browse</p>
      <input
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        ref={inputRef}
        type="file"
      />
      <button
        className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        Select File
      </button>
    </div>
  )
}

export default DropzoneUpload
