import { useEffect, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'
import { listUsers } from '../lib/api'

function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') return
    listUsers()
      .then((response) => setUsers(response.items || []))
      .catch((loadError) => setError(loadError.message || 'Failed to load users'))
  }, [user?.role])

  if (user.role !== 'admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Permission denied. Only admins can access user management.
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        action={
          <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900">
            Add User
          </button>
        }
        subtitle="Manage local-network accounts and roles"
        title="Users & Roles"
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((listedUser) => (
              <tr className="border-t border-slate-100" key={listedUser.id}>
                <td className="px-4 py-3">{listedUser.name}</td>
                <td className="px-4 py-3 capitalize">{listedUser.role}</td>
                <td className="px-4 py-3 capitalize">{listedUser.isActive ? 'active' : 'disabled'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export default UsersPage
