import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../common/ThemeToggle'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Library', to: '/library' },
  { label: 'Add Book', to: '/books/new' },
  { label: 'Search', to: '/search' },
  { label: 'Notes', to: '/notes' },
  { label: 'Snapshots', to: '/snapshots' },
  { label: 'Users', to: '/users' },
  { label: 'Settings', to: '/settings' },
]

function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="bg-gradient-to-b from-brand-900 via-brand-700 to-accent-700 px-4 py-6 text-slate-100 lg:w-64">
        <h1 className="mb-6 text-xl font-bold">Books Library</h1>
        <nav className="grid gap-1">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition ${
                  isActive ? 'bg-brand-700 text-white' : 'text-slate-200 hover:bg-brand-700/60'
                }`
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70 lg:px-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-300">Connected on local network server</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-100">
              {user.role}
            </span>
            <button
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppShell
