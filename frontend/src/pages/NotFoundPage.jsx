import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
      <h1 className="text-3xl font-bold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-600">The route you requested does not exist.</p>
      <Link className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white" to="/dashboard">
        Go to Dashboard
      </Link>
    </div>
  )
}

export default NotFoundPage
