export const books = [
  {
    id: 'b1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    type: 'ebook',
    format: 'PDF',
    category: 'Software Engineering',
    tags: ['coding', 'best-practices'],
    progress: 42,
    language: 'English',
    shelf: null,
    lastOpened: '2026-03-05',
    fileUrl: '/samples/clean-code.pdf',
  },
  {
    id: 'b2',
    title: 'Atomic Habits',
    author: 'James Clear',
    type: 'physical',
    format: null,
    category: 'Self Development',
    tags: ['habits'],
    progress: 15,
    language: 'English',
    shelf: 'A2-03',
    lastOpened: '2026-03-04',
    fileUrl: null,
  },
  {
    id: 'b3',
    title: 'Deep Work',
    author: 'Cal Newport',
    type: 'ebook',
    format: 'EPUB',
    category: 'Productivity',
    tags: ['focus'],
    progress: 60,
    language: 'English',
    shelf: null,
    lastOpened: '2026-03-03',
    fileUrl: '/samples/deep-work.epub',
  },
]

export const notes = [
  {
    id: 'n1',
    bookId: 'b1',
    page: 'Page 118',
    section: 'Meaningful Names',
    type: 'text',
    content: 'Prefer intention-revealing names for services and DTOs.',
    author: 'Admin',
    createdAt: '2026-03-05 09:10',
  },
  {
    id: 'n2',
    bookId: 'b2',
    page: 'Snapshot 7',
    section: 'Chapter 2',
    type: 'voice',
    content: 'Voice note (00:32)',
    author: 'Sara',
    createdAt: '2026-03-04 20:30',
  },
  {
    id: 'n3',
    bookId: 'b3',
    page: 'Page 54',
    section: 'Rule #1',
    type: 'text',
    content: 'Define deep work blocks in weekly plan.',
    author: 'Admin',
    createdAt: '2026-03-03 12:12',
  },
]

export const snapshots = [
  {
    id: 's1',
    bookId: 'b2',
    pageRef: 'Page 33',
    uploadedBy: 'Sara',
    ocrStatus: 'Completed',
    extractedText: 'You do not rise to the level of your goals...',
  },
  {
    id: 's2',
    bookId: 'b2',
    pageRef: 'Page 41',
    uploadedBy: 'Admin',
    ocrStatus: 'Processing',
    extractedText: '',
  },
]

export const users = [
  { id: 'u1', name: 'Admin', role: 'admin', status: 'active' },
  { id: 'u2', name: 'Sara', role: 'member', status: 'active' },
  { id: 'u3', name: 'Omar', role: 'member', status: 'disabled' },
]

export function getBookById(bookId) {
  return books.find((book) => book.id === bookId) || null
}
