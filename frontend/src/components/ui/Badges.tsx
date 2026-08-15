import type { UiStatus, Prioridad, UiRol } from '../../types'

export function statusColor(status: UiStatus) {
  switch (status) {
    case 'Abierta':     return { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', border: '#fecaca' }
    case 'En progreso': return { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b', border: '#fde68a' }
    case 'Resuelta':    return { bg: '#ecfdf5', text: '#059669', dot: '#10b981', border: '#a7f3d0' }
    case 'Cerrada':     return { bg: '#f8fafc', text: '#64748b', dot: '#94a3b8', border: '#e2e8f0' }
  }
}

export function StatusBadge({ status }: { status: UiStatus }) {
  const c = statusColor(status)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Prioridad }) {
  const map = {
    Alta: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    Media: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    Baja: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
  }
  const c = map[priority]
  return (
    <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {priority}
    </span>
  )
}

export function RoleBadge({ role }: { role: UiRol }) {
  const map: Record<UiRol, { label: string; bg: string; text: string }> = {
    estudiante: { label: 'Estudiante', bg: '#eff6ff', text: '#1d4ed8' },
    tecnico: { label: 'Técnico TI', bg: '#f0fdf4', text: '#15803d' },
    administrador: { label: 'Administrador', bg: '#faf5ff', text: '#7c3aed' },
  }
  const c = map[role]
  return (
    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text }}>
      {c.label}
    </span>
  )
}
