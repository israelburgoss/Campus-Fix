import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UiRol } from '../../types'

const roleColors: Record<UiRol, string> = { estudiante: '#3b82f6', tecnico: '#10b981', administrador: '#8b5cf6' }
const roleLabels: Record<UiRol, string> = { estudiante: 'Estudiante', tecnico: 'Técnico TI', administrador: 'Administrador' }

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const navItems: { to: string; label: string; roles: UiRol[]; icon: React.ReactNode }[] = [
    {
      to: '/incidencias',
      label: 'Incidencias',
      roles: ['estudiante', 'tecnico', 'administrador'],
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
    },
    {
      to: '/incidencias/nueva',
      label: 'Nueva incidencia',
      roles: ['estudiante'],
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
  ]

  const visible = navItems.filter(n => n.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={{ width: 240, minWidth: 240, background: '#0f2a4a', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, flexShrink: 0 }}>
      <div style={{ padding: '26px 22px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>CampusFix</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>Soporte TI</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '14px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, padding: '0 8px 10px' }}>Navegación</div>
        {visible.map(item => (
          <NavLink key={item.to} to={item.to}
            style={({ isActive }) => ({
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(59,130,246,0.18)' : 'transparent', color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: isActive ? 600 : 400, textAlign: 'left', marginBottom: 2, borderLeft: `3px solid ${isActive ? '#3b82f6' : 'transparent'}`, transition: 'all 0.15s', textDecoration: 'none',
            })}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${roleColors[user.role]}, ${roleColors[user.role]}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: roleColors[user.role], fontWeight: 500 }}>{roleLabels[user.role]}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
