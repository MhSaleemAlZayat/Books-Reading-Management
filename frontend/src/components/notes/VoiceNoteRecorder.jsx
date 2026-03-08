import { useRef, useState } from 'react'
import { uploadVoiceNote } from '../../lib/api'
import ProgressBar from '../common/ProgressBar'

function VoiceNoteRecorder({ bookId, page, section }) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      setError('Microphone access is required to record voice notes.')
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    setIsRecording(false)
  }

  const handleUpload = async () => {
    if (!audioBlob) return

    try {
      setStatus('Uploading voice note...')
      setUploadProgress(0)
      await uploadVoiceNote(bookId, audioBlob, { page, section }, setUploadProgress)
      setStatus('Voice note uploaded successfully.')
    } catch (uploadError) {
      setStatus('')
      setError(uploadError.message || 'Voice note upload failed.')
    }
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Voice Note</h4>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
        Record and upload a voice note linked to current page/section.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          disabled={isRecording}
          onClick={startRecording}
          type="button"
        >
          Start Record
        </button>
        <button
          className="rounded-md bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100"
          disabled={!isRecording}
          onClick={stopRecording}
          type="button"
        >
          Stop
        </button>
        <button
          className="rounded-md bg-brand-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-brand-900"
          disabled={!audioBlob}
          onClick={handleUpload}
          type="button"
        >
          Upload
        </button>
      </div>
      {audioUrl ? <audio className="mt-3 w-full" controls src={audioUrl} /> : null}
      {uploadProgress > 0 ? <ProgressBar value={uploadProgress} /> : null}
      {status ? <p className="mt-2 text-xs text-emerald-600">{status}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export default VoiceNoteRecorder
