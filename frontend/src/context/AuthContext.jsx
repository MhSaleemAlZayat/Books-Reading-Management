import { createContext, useContext, useMemo, useState } from 'react'

const USER_STORAGE_KEY = 'bookslib_user'
const ACCESS_TOKEN_STORAGE_KEY = 'bookslib_access_token'
const REFRESH_TOKEN_STORAGE_KEY = 'bookslib_refresh_token'
const AuthContext = createContext(undefined)

function getInitialUser() {
  const stored = localStorage.getItem(USER_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)

  const login = async (email, password) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      try {
        const json = await response.json()
        throw new Error(json?.error?.message || 'Login failed')
      } catch {
        const message = await response.text()
        throw new Error(message || 'Login failed')
      }
    }

    const result = await response.json()
    const nextUser = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
    }

    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, result.accessToken)
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, result.refreshToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
