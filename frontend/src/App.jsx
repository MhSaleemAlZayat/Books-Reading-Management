import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LibraryPage from './pages/LibraryPage'
import AddBookPage from './pages/AddBookPage'
import BookOverviewPage from './pages/BookOverviewPage'
import BookNotesPage from './pages/BookNotesPage'
import BookSnapshotsPage from './pages/BookSnapshotsPage'
import SearchPage from './pages/SearchPage'
import NotesCenterPage from './pages/NotesCenterPage'
import SnapshotsPage from './pages/SnapshotsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

const ReaderPage = lazy(() => import('./pages/ReaderPage'))

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="books/new" element={<AddBookPage />} />
              <Route path="books/:bookId" element={<BookOverviewPage />} />
              <Route
                path="books/:bookId/read"
                element={
                  <Suspense fallback={<p className="text-sm text-slate-500">Loading reader module...</p>}>
                    <ReaderPage />
                  </Suspense>
                }
              />
              <Route path="books/:bookId/notes" element={<BookNotesPage />} />
              <Route path="books/:bookId/snapshots" element={<BookSnapshotsPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="notes" element={<NotesCenterPage />} />
              <Route path="snapshots" element={<SnapshotsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
