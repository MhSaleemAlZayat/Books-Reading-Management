import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function PdfReader({
  source,
  pageNumber,
  onLoaded,
  heightClass,
  controls,
}) {
  const containerRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!containerRef.current) return undefined
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setContainerSize({
        width: Math.max(0, Math.floor(entry.contentRect.width)),
        height: Math.max(0, Math.floor(entry.contentRect.height)),
      })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const readerControls = controls || {}
  const fitMode = readerControls.fitMode || 'display'
  const zoom = readerControls.zoom || 1
  const displayPosition = readerControls.displayPosition || 'center'
  const alignmentClass =
    displayPosition === 'left'
      ? 'justify-start'
      : displayPosition === 'right'
        ? 'justify-end'
        : 'justify-center'

  const pageWidth = useMemo(() => {
    if (fitMode !== 'display') return undefined
    if (!containerSize.width) return 800
    return Math.max(300, Math.floor((containerSize.width - 24) * zoom))
  }, [containerSize.width, fitMode, zoom])

  const pageHeight = useMemo(() => {
    if (fitMode !== 'single') return undefined
    if (!containerSize.height) return 850
    return Math.max(300, Math.floor((containerSize.height - 24) * zoom))
  }, [containerSize.height, fitMode, zoom])

  return (
    <div
      className={`${heightClass || 'max-h-[70vh]'} overflow-auto rounded-md border border-slate-200 p-2 dark:border-slate-700`}
      ref={containerRef}
    >
      <Document file={source} onLoadSuccess={onLoaded}>
        <div className={`flex ${alignmentClass}`}>
          <Page height={pageHeight} pageNumber={pageNumber} width={pageWidth} />
        </div>
      </Document>
    </div>
  )
}

export default PdfReader
