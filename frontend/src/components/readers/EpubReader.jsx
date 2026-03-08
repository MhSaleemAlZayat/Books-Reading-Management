import { ReactReader } from 'react-reader'

function EpubReader({ sourceUrl, location, onLocationChanged, requestHeaders, heightClass }) {
  return (
    <div
      className={`${heightClass || 'h-[70vh]'} overflow-hidden rounded-md border border-slate-200 dark:border-slate-700`}
    >
      <ReactReader
        epubInitOptions={{ requestHeaders }}
        location={location}
        locationChanged={onLocationChanged}
        url={sourceUrl}
      />
    </div>
  )
}

export default EpubReader
