import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../../lib/api'
import { getToken, setToken, clearToken } from '../../lib/auth'
import { toUiUser } from '../../types'
import type { UiUser } from '../../types'

interface AuthContextValue {
  user: UiUser | null
  loading: boolean
  login: (correo: string, contrasena: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UiUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const { usuario } = await api.me()
        setUser(toUiUser(usuario))
      } catch {
        clearToken()
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = async (correo: string, contrasena: string) => {
    const { token, usuario } = await api.login(correo, contrasena)
    setToken(token)
    setUser(toUiUser(usuario))
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

export type { AuthContextValue }

