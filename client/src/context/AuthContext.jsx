// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { MOCK_USER } from '../data/mock.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // En dev, auto-login con mock user
    const stored = localStorage.getItem('atc_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  async function login(username, password) {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const res = await fetch(`${baseUrl}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al iniciar sesión')
      }
      
      const userData = await res.json()
      setUser(userData)
      localStorage.setItem('atc_user', JSON.stringify(userData))
      return userData
    } catch (err) {
      throw err
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('atc_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
