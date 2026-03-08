import { NavLink } from 'react-router-dom'

function BookSubnav({ bookId }) {
  const links = [
    { label: 'Overview', to: `/books/${bookId}` },
    { label: 'Read', to: `/books/${bookId}/read` },
    { label: 'Notes', to: `/books/${bookId}/notes` },
    { label: 'Snapshots', to: `/books/${bookId}/snapshots` },
  ]

  return (
    <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {links.map((link) => (
        <NavLink
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium ${
              isActive ? 'bg-brand-100 text-brand-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`
          }
          end={link.label === 'Overview'}
          key={link.to}
          to={link.to}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  )
}

export default BookSubnav
