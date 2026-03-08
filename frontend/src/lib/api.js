const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const ACCESS_TOKEN_STORAGE_KEY = 'bookslib_access_token'

async function requestJson(path, options = {}) {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  if (!response.ok) {
    const text = await response.text()
    let message = `Request failed: ${response.status}`
    try {
      const json = JSON.parse(text)
      if (json?.error?.message) message = json.error.message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}${path}`)
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return
      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress(percent)
    }

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          reject(new Error(json?.error?.message || `Request failed: ${xhr.status}`))
        } catch {
          reject(new Error(xhr.responseText || `Request failed: ${xhr.status}`))
        }
        return
      }

      try {
        resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null)
      } catch {
        resolve(null)
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.send(formData)
  })
}

export function createBook(payload) {
  return requestJson('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function listBooks() {
  return requestJson('/api/books')
}

export function getBook(bookId) {
  return requestJson(`/api/books/${bookId}`)
}

export function createBookWithFile(payload, file, onProgress) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => formData.append(key, value || ''))
  formData.append('file', file)
  return uploadWithProgress('/api/books', formData, onProgress)
}

export function listBookNotes(bookId) {
  return requestJson(`/api/books/${bookId}/notes`)
}

export function saveTextNote(bookId, payload) {
  return requestJson(`/api/books/${bookId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function uploadVoiceNote(bookId, audioBlob, payload, onProgress) {
  const formData = new FormData()
  formData.append('audio', audioBlob, `voice-note-${Date.now()}.webm`)
  formData.append('page', payload.page || '')
  formData.append('section', payload.section || '')

  return uploadWithProgress(`/api/books/${bookId}/voice-notes`, formData, onProgress)
}

export function listBookSnapshots(bookId) {
  return requestJson(`/api/books/${bookId}/snapshots`)
}

export function uploadSnapshot(bookId, file, pageRef, onProgress) {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('pageRef', pageRef || '')

  return uploadWithProgress(`/api/books/${bookId}/snapshots`, formData, onProgress)
}

export function uploadBookFile(bookId, file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  return uploadWithProgress(`/api/books/${bookId}/file`, formData, onProgress)
}

export function startOcr(snapshotId) {
  return requestJson(`/api/snapshots/${snapshotId}/ocr`, { method: 'POST' })
}

export function getOcrStatus(snapshotId) {
  return requestJson(`/api/snapshots/${snapshotId}/ocr-status`)
}

export function searchAll(query, type = 'all') {
  return requestJson(`/api/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`)
}

export function listUsers() {
  return requestJson('/api/users')
}

export function listNotes() {
  return requestJson('/api/notes')
}
