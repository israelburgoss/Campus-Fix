import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { UiRol } from '../../types'

export function RequireRole({ roles, children }: { roles: UiRol | UiRol[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(user.role)) return <Navigate to="/incidencias" replace />
  return <>{children}</>
}
