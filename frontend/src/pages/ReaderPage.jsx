import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import BookSubnav from '../components/books/BookSubnav'
import PageHeader from '../components/common/PageHeader'
import { getBook, saveTextNote } from '../lib/api'
import VoiceNoteRecorder from '../components/notes/VoiceNoteRecorder'

const PdfReader = lazy(() => import('../components/readers/PdfReader'))
const EpubReader = lazy(() => import('../components/readers/EpubReader'))
const QUICK_NOTE_STATE_KEY = 'bookslib_quick_note_state'
const QUICK_NOTE_OFFSET_KEY = 'bookslib_quick_note_offset'

function IconButton({ active = false, onClick, title, children, className = '' }) {
  return (
    <button
      className={`rounded-md p-2 ${
        active
          ? 'bg-brand-700 text-white'
          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
      } ${className}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

function ReaderPage() {
  const { bookId } = useParams()
  const readerContainerRef = useRef(null)
  const pageInputRef = useRef(null)
  const [book, setBook] = useState(null)
  const [bookError, setBookError] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [epubLocation, setEpubLocation] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [fitMode, setFitMode] = useState('display')
  const [displayPosition, setDisplayPosition] = useState('center')
  const [goToPageValue, setGoToPageValue] = useState('')
  const [quickNoteState, setQuickNoteState] = useState(() => {
    const stored = localStorage.getItem(QUICK_NOTE_STATE_KEY)
    if (stored === 'expanded' || stored === 'collapsed' || stored === 'hidden') return stored
    return 'expanded'
  })
  const [textNote, setTextNote] = useState('')
  const [noteStatus, setNoteStatus] = useState('')
  const [noteError, setNoteError] = useState('')
  const [noteOffset, setNoteOffset] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(QUICK_NOTE_OFFSET_KEY) || '{}')
      if (typeof stored.x === 'number' && typeof stored.y === 'number') return stored
      return { x: 0, y: 0 }
    } catch {
      return { x: 0, y: 0 }
    }
  })
  const [isDraggingNote, setIsDraggingNote] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    getBook(bookId)
      .then(setBook)
      .catch((error) => setBookError(error.message || 'Failed to load book'))
  }, [bookId])

  const readerType = useMemo(() => {
    if (book?.format === 'PDF') return 'pdf'
    if (book?.format === 'EPUB') return 'epub'
    return null
  }, [book?.format])

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const persistedFileUrl = book?.file?.downloadUrl
    ? `${apiBaseUrl}${book.file.downloadUrl}`
    : ''
  const sourceUrl = persistedFileUrl
  const accessToken = localStorage.getItem('bookslib_access_token')
  const requestHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  const pdfSource = useMemo(() => {
    if (!sourceUrl) return null
    return { url: sourceUrl, httpHeaders: requestHeaders }
  }, [sourceUrl, accessToken])
  const readerHeightClass = isFullscreen ? 'max-h-[calc(100vh-11rem)] h-[calc(100vh-11rem)]' : 'h-[70vh]'

  useEffect(() => {
    localStorage.setItem(QUICK_NOTE_STATE_KEY, quickNoteState)
  }, [quickNoteState])

  useEffect(() => {
    localStorage.setItem(QUICK_NOTE_OFFSET_KEY, JSON.stringify(noteOffset))
  }, [noteOffset])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === readerContainerRef.current)
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      const tagName = target?.tagName?.toLowerCase()
      const isTypingTarget =
        tagName === 'input' || tagName === 'textarea' || target?.isContentEditable === true
      const hasCtrlOrCmd = event.ctrlKey || event.metaKey
      const hasAlt = event.altKey

      if (hasCtrlOrCmd && event.key.toLowerCase() === 'g') {
        event.preventDefault()
        pageInputRef.current?.focus()
        return
      }
      if (isTypingTarget) return

      if (readerType === 'pdf' && (event.key === '+' || event.key === '=')) {
        event.preventDefault()
        handleZoomIn()
        return
      }
      if (readerType === 'pdf' && (event.key === '-' || event.key === '_')) {
        event.preventDefault()
        handleZoomOut()
        return
      }
      if (readerType === 'pdf' && hasAlt && event.key === '1') {
        event.preventDefault()
        setDisplayPosition('left')
        return
      }
      if (readerType === 'pdf' && hasAlt && event.key === '2') {
        event.preventDefault()
        setDisplayPosition('center')
        return
      }
      if (readerType === 'pdf' && hasAlt && event.key === '3') {
        event.preventDefault()
        setDisplayPosition('right')
        return
      }
      if (readerType === 'pdf' && hasAlt && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        handleFitDisplay()
        return
      }
      if (readerType === 'pdf' && hasAlt && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleFitSingle()
        return
      }
      if (event.key === 'ArrowRight' && readerType === 'pdf' && pageNumber < numPages) {
        event.preventDefault()
        setPageNumber((prev) => prev + 1)
        return
      }
      if (event.key === 'ArrowLeft' && readerType === 'pdf' && pageNumber > 1) {
        event.preventDefault()
        setPageNumber((prev) => prev - 1)
        return
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [readerType, pageNumber, numPages, isFullscreen, zoom])

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages)
    setPageNumber((prev) => {
      if (prev < 1) return 1
      if (prev > nextNumPages) return nextNumPages
      return prev
    })
  }

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen && readerContainerRef.current) {
        await readerContainerRef.current.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // Ignore browser-level fullscreen failures.
    }
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))
  const handleFitDisplay = () => setFitMode('display')
  const handleFitSingle = () => setFitMode('single')
  const handleGoToPage = () => {
    const value = Number(goToPageValue)
    if (!Number.isFinite(value) || value < 1 || !numPages) return
    setPageNumber(Math.min(numPages, Math.floor(value)))
  }

  const focusGoToPageInput = () => {
    pageInputRef.current?.focus()
  }

  const handleSaveTextNote = async () => {
    if (!textNote.trim()) return

    try {
      setNoteError('')
      setNoteStatus('Saving text note...')
      await saveTextNote(book.id, {
        content: textNote,
        page: anchorPage,
        section: readerType === 'epub' ? epubLocation : '',
      })
      setTextNote('')
      setNoteStatus('Text note saved.')
    } catch (error) {
      setNoteStatus('')
      setNoteError(error.message || 'Failed to save text note.')
    }
  }

  const notePanelClasses = isFullscreen
    ? 'absolute right-4 top-16 z-30 w-[360px]'
    : 'absolute right-4 top-16 z-20 w-[340px]'

  const resetNotePanelPosition = () => setNoteOffset({ x: 0, y: 0 })

  const startNoteDrag = (event) => {
    const point = 'touches' in event ? event.touches[0] : event
    if (!point) return
    dragStartRef.current = {
      x: point.clientX,
      y: point.clientY,
      offsetX: noteOffset.x,
      offsetY: noteOffset.y,
    }
    setIsDraggingNote(true)
  }

  useEffect(() => {
    if (!isDraggingNote) return undefined

    const onMove = (event) => {
      const point = 'touches' in event ? event.touches[0] : event
      if (!point) return
      const deltaX = point.clientX - dragStartRef.current.x
      const deltaY = point.clientY - dragStartRef.current.y
      setNoteOffset({
        x: dragStartRef.current.offsetX + deltaX,
        y: dragStartRef.current.offsetY + deltaY,
      })
    }

    const onEnd = () => setIsDraggingNote(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDraggingNote])

  if (bookError) return <p className="text-sm text-red-700">{bookError}</p>
  if (!book) return <p className="text-sm text-slate-600">Loading book...</p>
  const anchorPage = readerType === 'pdf' ? `Page ${pageNumber}` : 'Section'

  return (
    <div>
      <PageHeader subtitle="Reader and annotation workspace" title={`${book.title} Reader`} />
      <BookSubnav bookId={book.id} />

      <div
        className={`relative rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 ${
          isFullscreen ? 'h-screen' : ''
        }`}
        ref={readerContainerRef}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
          <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {readerType === 'pdf' ? 'PDF Reader' : readerType === 'epub' ? 'EPUB Reader' : 'Reader'}
          </span>
          <IconButton onClick={toggleFullscreen} title="Fullscreen (F)">
            <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 21h-5v-5" />
            </svg>
          </IconButton>
          <IconButton onClick={() => setQuickNoteState(quickNoteState === 'hidden' ? 'expanded' : 'hidden')} title="Toggle Quick Note">
            <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M4 5h16v14H4z" />
              <path d="M8 9h8M8 13h5" />
            </svg>
          </IconButton>
          <IconButton onClick={() => setQuickNoteState(quickNoteState === 'expanded' ? 'collapsed' : 'expanded')} title="Collapse/Expand Quick Note">
            <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </IconButton>
          <IconButton onClick={resetNotePanelPosition} title="Reset panel position">
            <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M3 12a9 9 0 109-9" />
              <path d="M3 3v6h6" />
            </svg>
          </IconButton>

          {readerType === 'pdf' && sourceUrl ? (
            <>
              <IconButton onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))} title="Previous page (Left Arrow)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </IconButton>
              <IconButton onClick={() => setPageNumber((prev) => Math.min(numPages || prev, prev + 1))} title="Next page (Right Arrow)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </IconButton>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {pageNumber}/{numPages || '?'}
              </span>

              <IconButton onClick={handleZoomOut} title="Zoom Out (-)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M8 11h6M20 20l-3.5-3.5" />
                </svg>
              </IconButton>
              <IconButton onClick={handleZoomIn} title="Zoom In (+)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M11 8v6M8 11h6M20 20l-3.5-3.5" />
                </svg>
              </IconButton>
              <IconButton active={fitMode === 'display'} onClick={handleFitDisplay} title="Fit Display (Alt+D)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <rect height="14" width="18" x="3" y="5" />
                </svg>
              </IconButton>
              <IconButton active={fitMode === 'single'} onClick={handleFitSingle} title="Fit Single Page (Alt+S)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <rect height="14" width="10" x="7" y="5" />
                </svg>
              </IconButton>
              <IconButton active={displayPosition === 'left'} onClick={() => setDisplayPosition('left')} title="Align Left (Alt+1)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <path d="M4 4v16M8 8h12M8 16h8" />
                </svg>
              </IconButton>
              <IconButton active={displayPosition === 'center'} onClick={() => setDisplayPosition('center')} title="Align Center (Alt+2)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <path d="M12 4v16M6 8h12M8 16h8" />
                </svg>
              </IconButton>
              <IconButton active={displayPosition === 'right'} onClick={() => setDisplayPosition('right')} title="Align Right (Alt+3)">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <path d="M20 4v16M4 8h12M8 16h12" />
                </svg>
              </IconButton>

              <form
                className="ml-auto flex items-center gap-1"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleGoToPage()
                }}
              >
                <input
                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                  min={1}
                  onChange={(event) => setGoToPageValue(event.target.value)}
                  placeholder="Pg"
                  ref={pageInputRef}
                  title="Go to page (Ctrl/Cmd+G)"
                  type="number"
                  value={goToPageValue}
                />
                <button
                  className="rounded-md bg-brand-700 p-2 text-white"
                  title="Go"
                  type="submit"
                >
                  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
            </>
          ) : null}
        </div>

        <section>
          {!sourceUrl ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              No ebook file is attached to this book.
              <Link className="ml-2 font-semibold text-brand-700 underline" to={`/books/${book.id}`}>
                Go to Overview to upload file
              </Link>
            </div>
          ) : null}

          {sourceUrl && readerType === 'pdf' ? (
            <Suspense fallback={<p className="text-sm text-slate-500">Loading PDF reader...</p>}>
              <PdfReader
                heightClass={isFullscreen ? 'max-h-[calc(100vh-12rem)]' : 'max-h-[70vh]'}
                numPages={numPages}
                onLoaded={onDocumentLoadSuccess}
                onNextPage={() => setPageNumber((prev) => prev + 1)}
                onPrevPage={() => setPageNumber((prev) => prev - 1)}
                pageNumber={pageNumber}
                source={pdfSource || sourceUrl}
                controls={{
                  zoom,
                  fitMode,
                  displayPosition,
                  isFullscreen,
                  onZoomIn: handleZoomIn,
                  onZoomOut: handleZoomOut,
                  onFitDisplay: handleFitDisplay,
                  onFitSingle: handleFitSingle,
                  onDisplayPositionChange: setDisplayPosition,
                  goToPageValue,
                  setGoToPageValue,
                  onGoToPage: handleGoToPage,
                  onFocusGoToPage: focusGoToPageInput,
                  goToPageInputRef: pageInputRef,
                }}
              />
            </Suspense>
          ) : null}

          {sourceUrl && readerType === 'epub' ? (
            <Suspense fallback={<p className="text-sm text-slate-500">Loading EPUB reader...</p>}>
              <EpubReader
                heightClass={readerHeightClass}
                location={epubLocation}
                onLocationChanged={setEpubLocation}
                requestHeaders={requestHeaders}
                sourceUrl={sourceUrl}
              />
            </Suspense>
          ) : null}
        </section>

        {quickNoteState !== 'hidden' ? (
          <aside className={notePanelClasses} style={{ transform: `translate(${noteOffset.x}px, ${noteOffset.y}px)` }}>
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div
                className="flex cursor-move items-center justify-between gap-2"
                onMouseDown={startNoteDrag}
                onTouchStart={startNoteDrag}
                role="presentation"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick Note</h3>
                <div className="flex gap-1">
                  {quickNoteState === 'expanded' ? (
                    <button
                      className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                      onClick={() => setQuickNoteState('collapsed')}
                      type="button"
                    >
                      Collapse
                    </button>
                  ) : (
                    <button
                      className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                      onClick={() => setQuickNoteState('expanded')}
                      type="button"
                    >
                      Expand
                    </button>
                  )}
                  <button
                    className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
                    onClick={() => setQuickNoteState('hidden')}
                    type="button"
                  >
                    Hide
                  </button>
                  <button
                    className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                    onClick={resetNotePanelPosition}
                    type="button"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {quickNoteState === 'expanded' ? (
                <>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                    Anchored to {anchorPage}
                  </p>
                  <textarea
                    className="mt-3 w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(event) => setTextNote(event.target.value)}
                    placeholder="Write text note for this page or section..."
                    rows={4}
                    value={textNote}
                  />
                  <button
                    className="mt-3 rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-900"
                    onClick={handleSaveTextNote}
                    type="button"
                  >
                    Save Text Note
                  </button>
                  {noteStatus ? <p className="mt-2 text-xs text-emerald-600">{noteStatus}</p> : null}
                  {noteError ? <p className="mt-2 text-xs text-red-600">{noteError}</p> : null}

                  <VoiceNoteRecorder
                    bookId={book.id}
                    page={anchorPage}
                    section={readerType === 'epub' ? epubLocation || 'epub-section' : ''}
                  />
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                  Quick Note collapsed. Use Expand to continue writing.
                </p>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}

export default ReaderPage
