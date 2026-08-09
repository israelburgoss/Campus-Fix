import { useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Page = 'login' | 'list' | 'register' | 'detail' | 'assign'

type Status = 'Abierta' | 'En progreso' | 'Resuelta' | 'Cerrada'
type Priority = 'Alta' | 'Media' | 'Baja'
type Category = 'Hardware' | 'Software' | 'Red' | 'Impresión' | 'Acceso' | 'Otro'

interface User {
  name: string
  role: 'Estudiante' | 'Docente' | 'Administrativo' | 'Técnico' | 'Coordinador'
  email: string
  faculty: string
}

interface Technician {
  id: number
  name: string
  specialty: string
  available: boolean
}

interface Incident {
  id: string
  title: string
  description: string
  category: Category
  priority: Priority
  status: Status
  reportedBy: string
  reportedRole: string
  location: string
  equipment: string
  createdAt: string
  updatedAt: string
  assignedTo: string | null
  diagnosis: string
  resolution: string
  history: HistoryEntry[]
}

interface HistoryEntry {
  date: string
  action: string
  by: string
  note: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TECHNICIANS: Technician[] = [
  { id: 1, name: 'Carlos Mendoza', specialty: 'Hardware / Redes', available: true },
  { id: 2, name: 'Ana Quispe', specialty: 'Software / Sistemas', available: true },
  { id: 3, name: 'Diego Paredes', specialty: 'Impresión / Periféricos', available: false },
  { id: 4, name: 'Lucía Vargas', specialty: 'Redes / Servidores', available: true },
]

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2024-001',
    title: 'Computadora del laboratorio A2-12 no enciende',
    description: 'Al presionar el botón de encendido, la computadora no responde. No hay indicadores de LED y el monitor permanece en negro.',
    category: 'Hardware',
    priority: 'Alta',
    status: 'En progreso',
    reportedBy: 'Mg. Rosa Flores Huanca',
    reportedRole: 'Docente',
    location: 'Laboratorio A2 - Pabellón A, Piso 2',
    equipment: 'PC Escritorio HP ProDesk 400 G6',
    createdAt: '2024-11-18 08:42',
    updatedAt: '2024-11-18 10:15',
    assignedTo: 'Carlos Mendoza',
    diagnosis: 'Posible falla en la fuente de poder. Se requiere reemplazo.',
    resolution: '',
    history: [
      { date: '2024-11-18 08:42', action: 'Incidencia registrada', by: 'Mg. Rosa Flores Huanca', note: 'Urgente, clase a las 9am.' },
      { date: '2024-11-18 10:15', action: 'Técnico asignado', by: 'Coordinador TI', note: 'Asignado a Carlos Mendoza para revisión inmediata.' },
    ],
  },
  {
    id: 'INC-2024-002',
    title: 'Sin acceso a la plataforma Moodle',
    description: 'Varios estudiantes de la sección B del curso de Cálculo reportan no poder ingresar a Moodle. El sistema muestra error 503.',
    category: 'Software',
    priority: 'Alta',
    status: 'Abierta',
    reportedBy: 'Est. Kevin Rojas Salinas',
    reportedRole: 'Estudiante',
    location: 'Virtual / Campus General',
    equipment: 'Plataforma Moodle v4.1',
    createdAt: '2024-11-18 09:05',
    updatedAt: '2024-11-18 09:05',
    assignedTo: null,
    diagnosis: '',
    resolution: '',
    history: [
      { date: '2024-11-18 09:05', action: 'Incidencia registrada', by: 'Est. Kevin Rojas Salinas', note: 'Afecta a toda la sección, examen online hoy.' },
    ],
  },
  {
    id: 'INC-2024-003',
    title: 'Impresora de Secretaría no imprime en color',
    description: 'La impresora Canon PIXMA produce solo impresiones en escala de grises. El tóner de color fue reemplazado recientemente.',
    category: 'Impresión',
    priority: 'Media',
    status: 'Resuelta',
    reportedBy: 'Lic. María Torres Campos',
    reportedRole: 'Administrativo',
    location: 'Secretaría Académica - Pabellón B, Piso 1',
    equipment: 'Canon PIXMA G3160',
    createdAt: '2024-11-15 14:20',
    updatedAt: '2024-11-16 11:00',
    assignedTo: 'Diego Paredes',
    diagnosis: 'El cartucho de color no fue instalado correctamente. Se detectó aire en el sistema de tinta.',
    resolution: 'Se purgó el sistema de tinta y se reinstalaron los cartuchos. Impresora operativa.',
    history: [
      { date: '2024-11-15 14:20', action: 'Incidencia registrada', by: 'Lic. María Torres Campos', note: 'Necesaria para imprimir certificados.' },
      { date: '2024-11-15 15:30', action: 'Técnico asignado', by: 'Coordinador TI', note: '' },
      { date: '2024-11-16 11:00', action: 'Incidencia resuelta', by: 'Diego Paredes', note: 'Cartucho reinstalado, prueba exitosa.' },
    ],
  },
  {
    id: 'INC-2024-004',
    title: 'Red inalámbrica intermitente en Sala de Docentes',
    description: 'La conexión WiFi en la sala de docentes del pabellón C cae cada 20-30 minutos, obligando a reconectarse constantemente.',
    category: 'Red',
    priority: 'Media',
    status: 'Abierta',
    reportedBy: 'Dr. Pablo Ochoa Ríos',
    reportedRole: 'Docente',
    location: 'Sala de Docentes - Pabellón C, Piso 3',
    equipment: 'Access Point Cisco Meraki MR33',
    createdAt: '2024-11-17 16:00',
    updatedAt: '2024-11-17 16:00',
    assignedTo: null,
    diagnosis: '',
    resolution: '',
    history: [
      { date: '2024-11-17 16:00', action: 'Incidencia registrada', by: 'Dr. Pablo Ochoa Ríos', note: 'Problema recurrente desde hace 1 semana.' },
    ],
  },
  {
    id: 'INC-2024-005',
    title: 'Cuenta bloqueada en sistema académico SIGMA',
    description: 'El usuario no puede iniciar sesión en SIGMA tras varios intentos fallidos. El área de TI no responde al correo.',
    category: 'Acceso',
    priority: 'Baja',
    status: 'Cerrada',
    reportedBy: 'Est. Gabriela Mamani',
    reportedRole: 'Estudiante',
    location: 'Virtual',
    equipment: 'SIGMA - Sistema de Gestión Académica',
    createdAt: '2024-11-10 11:30',
    updatedAt: '2024-11-11 09:00',
    assignedTo: 'Ana Quispe',
    diagnosis: 'Cuenta bloqueada por 5 intentos fallidos. Política de seguridad activa.',
    resolution: 'Se desbloqueó la cuenta y se solicitó cambio de contraseña. Usuario notificado.',
    history: [
      { date: '2024-11-10 11:30', action: 'Incidencia registrada', by: 'Est. Gabriela Mamani', note: '' },
      { date: '2024-11-10 13:00', action: 'Técnico asignado', by: 'Coordinador TI', note: '' },
      { date: '2024-11-11 09:00', action: 'Incidencia cerrada', by: 'Ana Quispe', note: 'Resuelto satisfactoriamente.' },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: Status) {
  switch (status) {
    case 'Abierta': return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' }
    case 'En progreso': return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' }
    case 'Resuelta': return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' }
    case 'Cerrada': return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' }
  }
}

function priorityColor(p: Priority) {
  switch (p) {
    case 'Alta': return 'text-red-600 bg-red-50 border-red-200'
    case 'Media': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'Baja': return 'text-slate-500 bg-slate-50 border-slate-200'
  }
}

function Badge({ label, variant }: { label: string; variant: 'status' | 'priority'; status?: Status; priority?: Priority }) {
  return null
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function Sidebar({ user, active, onNav }: { user: User; active: Page; onNav: (p: Page) => void }) {
  const items = [
    { page: 'list' as Page, label: 'Incidencias', icon: '◼' },
    { page: 'register' as Page, label: 'Nueva incidencia', icon: '+' },
  ]
  return (
    <aside style={{ width: 240, minWidth: 240, background: '#0f2a4a', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      {/* Brand */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>CampusFix</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>Soporte TI</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, padding: '0 8px 10px' }}>Menú principal</div>
        {items.map(item => {
          const isActive = active === item.page
          return (
            <button
              key={item.page}
              onClick={() => onNav(item.page)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.55)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                textAlign: 'left',
                marginBottom: 2,
                transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.role}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #dde3ec', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
      <div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, margin: 0, color: '#0f2a4a' }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 1 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{actions}</div>}
    </div>
  )
}

function AppShell({ user, active, onNav, title, subtitle, actions, children }: {
  user: User; active: Page; onNav: (p: Page) => void
  title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa' }}>
      <Sidebar user={user} active={active} onNav={onNav} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── Page: Login ──────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<User['role']>('Docente')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Complete todos los campos.'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin({ name: 'Coordinador TI', role: 'Coordinador', email, faculty: 'Dirección de TI' })
    }, 900)
  }

  const demoUsers = [
    { label: 'Coordinador TI', email: 'coordinador@universidad.edu.pe', role: 'Coordinador' as User['role'] },
    { label: 'Docente', email: 'r.flores@universidad.edu.pe', role: 'Docente' as User['role'] },
    { label: 'Estudiante', email: 'k.rojas@estudiante.edu.pe', role: 'Estudiante' as User['role'] },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff' }}>
      {/* Left panel */}
      <div style={{ background: '#0f2a4a', display: 'flex', flexDirection: 'column', padding: '48px 56px', position: 'relative', overflow: 'hidden' }}>
        {/* Background grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Accent shapes */}
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)' }} />
        <div style={{ position: 'absolute', top: 100, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff' }}>CampusFix</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>Universidad Tecnológica</div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 38, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>
            Gestión de<br />Incidencias TI
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0, maxWidth: 340 }}>
            Plataforma centralizada para el registro, seguimiento y resolución de incidencias tecnológicas en el campus universitario.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '◈', text: 'Registro y seguimiento en tiempo real' },
              { icon: '◈', text: 'Asignación inteligente de técnicos' },
              { icon: '◈', text: 'Historial completo de intervenciones' },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#3b82f6', fontSize: 14 }}>{f.icon}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 28, margin: '0 0 8px', color: '#0f2a4a' }}>Iniciar sesión</h1>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Ingresa tus credenciales institucionales</p>
          </div>

          {/* Demo quick select */}
          <div style={{ marginBottom: 24, background: '#f5f7fa', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Acceso rápido (demo)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {demoUsers.map(u => (
                <button key={u.email} onClick={() => { setEmail(u.email); setRole(u.role) }}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #dde3ec', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#1a3d6b', fontWeight: 500, transition: 'all 0.15s' }}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }}>Correo institucional</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="usuario@universidad.edu.pe"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #dde3ec', fontSize: 14, outline: 'none', color: '#1a2332', background: '#fff', transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#dde3ec'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }}>Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #dde3ec', fontSize: 14, outline: 'none', color: '#1a2332', background: '#fff', transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#dde3ec'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }}>Rol</label>
              <select value={role} onChange={e => setRole(e.target.value as User['role'])}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #dde3ec', fontSize: 14, outline: 'none', color: '#1a2332', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                <option>Estudiante</option>
                <option>Docente</option>
                <option>Administrativo</option>
                <option>Técnico</option>
                <option>Coordinador</option>
              </select>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ padding: '13px', borderRadius: 8, border: 'none', background: loading ? '#93c5fd' : '#1a3d6b', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', letterSpacing: 0.2 }}>
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#94a3b8' }}>
            ¿Problemas para acceder? Contacta a soporte: <span style={{ color: '#3b82f6' }}>ti@universidad.edu.pe</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Page: Incident List ──────────────────────────────────────────────────────

function IncidentList({ incidents, user, onView, onRegister, onLogout }: {
  incidents: Incident[]; user: User; onView: (id: string) => void
  onRegister: () => void; onLogout: () => void
}) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'Todas'>('Todas')
  const [filterPriority, setFilterPriority] = useState<Priority | 'Todas'>('Todas')

  const filtered = incidents.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()) || i.reportedBy.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'Todas' || i.status === filterStatus
    const matchPriority = filterPriority === 'Todas' || i.priority === filterPriority
    return matchSearch && matchStatus && matchPriority
  })

  const stats = [
    { label: 'Total', value: incidents.length, color: '#1a3d6b' },
    { label: 'Abiertas', value: incidents.filter(i => i.status === 'Abierta').length, color: '#ef4444' },
    { label: 'En progreso', value: incidents.filter(i => i.status === 'En progreso').length, color: '#f59e0b' },
    { label: 'Resueltas', value: incidents.filter(i => i.status === 'Resuelta').length, color: '#10b981' },
  ]

  return (
    <AppShell user={user} active="list" onNav={p => { if (p === 'register') onRegister() }}
      title="Listado de incidencias"
      subtitle={`${filtered.length} incidencia${filtered.length !== 1 ? 's' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`}
      actions={
        <>
          <button onClick={onLogout} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>
            Cerrar sesión
          </button>
          <button onClick={onRegister}
            style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1a3d6b', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            + Nueva incidencia
          </button>
        </>
      }
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '18px 22px', border: '1px solid #dde3ec', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 32, color: s.color }}>{s.value}</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', border: '1px solid #dde3ec', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por ID, título, usuario..."
          style={{ flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a2332' }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#dde3ec'}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          style={{ padding: '9px 12px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 13, outline: 'none', color: '#1a2332', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
          <option value="Todas">Estado: Todos</option>
          <option>Abierta</option>
          <option>En progreso</option>
          <option>Resuelta</option>
          <option>Cerrada</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)}
          style={{ padding: '9px 12px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 13, outline: 'none', color: '#1a2332', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
          <option value="Todas">Prioridad: Todas</option>
          <option>Alta</option>
          <option>Media</option>
          <option>Baja</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f7fa', borderBottom: '1px solid #dde3ec' }}>
              {['ID', 'Incidencia', 'Categoría', 'Prioridad', 'Estado', 'Reportado por', 'Fecha', 'Asignado a', ''].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>No se encontraron incidencias</td></tr>
            )}
            {filtered.map((inc, idx) => {
              const sc = statusColor(inc.status)
              return (
                <tr key={inc.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  onClick={() => onView(inc.id)}>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>{inc.id}</span>
                  </td>
                  <td style={{ padding: '13px 14px', maxWidth: 240 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2a4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{inc.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{inc.location}</div>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: 5, fontWeight: 500 }}>{inc.category}</span>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 5, border: '1px solid', fontWeight: 600, ...Object.fromEntries(priorityColor(inc.priority).split(' ').map(c => {
                      if (c.startsWith('text-')) return ['color', c === 'text-red-600' ? '#dc2626' : c === 'text-amber-600' ? '#d97706' : '#64748b']
                      return ['background', 'transparent']
                    })) }}>
                      {inc.priority}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}
                      className={`${sc.bg} ${sc.text} border ${sc.border}`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%' }} className={sc.dot} />
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{inc.reportedBy}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{inc.reportedRole}</div>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{inc.createdAt}</td>
                  <td style={{ padding: '13px 14px' }}>
                    {inc.assignedTo
                      ? <span style={{ fontSize: 12, color: '#1a3d6b', fontWeight: 500 }}>{inc.assignedTo}</span>
                      : <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Sin asignar</span>
                    }
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <button onClick={e => { e.stopPropagation(); onView(inc.id) }}
                      style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #dde3ec', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#1a3d6b', fontWeight: 600, transition: 'all 0.15s' }}>
                      Ver
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}

// ─── Page: Register Incident ──────────────────────────────────────────────────

function RegisterIncident({ user, onSave, onCancel }: { user: User; onSave: (inc: Incident) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Hardware' as Category,
    priority: 'Media' as Priority, location: '', equipment: '',
  })
  const [saved, setSaved] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')
    const id = `INC-2024-00${Math.floor(Math.random() * 900 + 100)}`
    const newInc: Incident = {
      id,
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      status: 'Abierta',
      reportedBy: user.name,
      reportedRole: user.role,
      location: form.location,
      equipment: form.equipment,
      createdAt: now,
      updatedAt: now,
      assignedTo: null,
      diagnosis: '',
      resolution: '',
      history: [{ date: now, action: 'Incidencia registrada', by: user.name, note: '' }],
    }
    setSaved(true)
    setTimeout(() => onSave(newInc), 1200)
  }

  if (saved) {
    return (
      <AppShell user={user} active="register" onNav={() => {}} title="Nueva incidencia">
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: '#0f2a4a', margin: '0 0 8px' }}>Incidencia registrada</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Tu incidencia ha sido creada exitosamente. El equipo de TI la revisará pronto.</p>
        </div>
      </AppShell>
    )
  }

  const fieldStyle: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 14, outline: 'none', color: '#1a2332', background: '#fff', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }

  return (
    <AppShell user={user} active="register" onNav={() => {}} title="Registrar nueva incidencia" subtitle="Completa el formulario para reportar un problema tecnológico"
      actions={<button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>Cancelar</button>}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Basic info */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Información general</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Título de la incidencia <span style={{ color: '#ef4444' }}>*</span></label>
                <input required value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Ej: Computadora del laboratorio no enciende"
                  style={fieldStyle}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#dde3ec'} />
              </div>
              <div>
                <label style={labelStyle}>Descripción detallada <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea required value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Describe el problema con el mayor detalle posible: cuándo ocurrió, qué estabas haciendo, mensajes de error..."
                  rows={4}
                  style={{ ...fieldStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#dde3ec'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Categoría <span style={{ color: '#ef4444' }}>*</span></label>
                  <select required value={form.category} onChange={e => set('category', e.target.value as Category)}
                    style={fieldStyle}>
                    <option>Hardware</option>
                    <option>Software</option>
                    <option>Red</option>
                    <option>Impresión</option>
                    <option>Acceso</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Prioridad <span style={{ color: '#ef4444' }}>*</span></label>
                  <select required value={form.priority} onChange={e => set('priority', e.target.value as Priority)}
                    style={fieldStyle}>
                    <option>Alta</option>
                    <option>Media</option>
                    <option>Baja</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Ubicación y equipo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Ubicación <span style={{ color: '#ef4444' }}>*</span></label>
                <input required value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder="Ej: Laboratorio A2 - Pabellón A, Piso 2"
                  style={fieldStyle}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#dde3ec'} />
              </div>
              <div>
                <label style={labelStyle}>Equipo o sistema afectado</label>
                <input value={form.equipment} onChange={e => set('equipment', e.target.value)}
                  placeholder="Ej: PC HP ProDesk 400 G6, código de inventario INV-2891"
                  style={fieldStyle}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#dde3ec'} />
              </div>
            </div>
          </div>

          {/* Reporter */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Datos del solicitante</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nombre completo</label>
                <input value={user.name} readOnly style={{ ...fieldStyle, background: '#f8fafc', color: '#64748b' }} />
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <input value={user.role} readOnly style={{ ...fieldStyle, background: '#f8fafc', color: '#64748b' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={onCancel}
              style={{ padding: '11px 24px', borderRadius: 8, border: '1px solid #dde3ec', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ padding: '11px 28px', borderRadius: 8, border: 'none', background: '#1a3d6b', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              Registrar incidencia
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

// ─── Page: Incident Detail ────────────────────────────────────────────────────

function IncidentDetail({ incident, user, onBack, onAssign }: {
  incident: Incident; user: User; onBack: () => void; onAssign: () => void
}) {
  const sc = statusColor(incident.status)

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#1a2332', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )

  return (
    <AppShell user={user} active="list" onNav={() => {}} title={incident.id} subtitle={incident.title}
      actions={
        <>
          <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>← Volver</button>
          {(incident.status === 'Abierta' || incident.status === 'En progreso') && user.role === 'Coordinador' && (
            <button onClick={onAssign}
              style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1a3d6b', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Gestionar incidencia
            </button>
          )}
        </>
      }
    >
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header card */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: '#0f2a4a', margin: '0 0 6px' }}>{incident.title}</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#3b82f6', fontWeight: 700, background: '#eff6ff', padding: '3px 10px', borderRadius: 5 }}>{incident.id}</span>
                <span className={`${sc.bg} ${sc.text} ${sc.border}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid' }}>
                  <span className={sc.dot} style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block' }} />
                  {incident.status}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600, background: incident.priority === 'Alta' ? '#fef2f2' : incident.priority === 'Media' ? '#fffbeb' : '#f8fafc', color: incident.priority === 'Alta' ? '#dc2626' : incident.priority === 'Media' ? '#d97706' : '#64748b', border: '1px solid', borderColor: incident.priority === 'Alta' ? '#fecaca' : incident.priority === 'Media' ? '#fde68a' : '#e2e8f0' }}>
                  {incident.priority} prioridad
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 5, fontSize: 12, color: '#475569', background: '#f1f5f9' }}>{incident.category}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
              <div>Creado: {incident.createdAt}</div>
              <div>Actualizado: {incident.updatedAt}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Descripción</div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{incident.description}</p>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '22px 26px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f2a4a', margin: '0 0 18px', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>Datos del reporte</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InfoRow label="Reportado por" value={incident.reportedBy} />
              <InfoRow label="Rol" value={incident.reportedRole} />
              <InfoRow label="Ubicación" value={incident.location} />
              <InfoRow label="Equipo afectado" value={incident.equipment} />
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '22px 26px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f2a4a', margin: '0 0 18px', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>Atención técnica</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InfoRow label="Técnico asignado" value={incident.assignedTo || 'Sin asignar'} />
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 6 }}>Diagnóstico</span>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{incident.diagnosis || '—'}</p>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 6 }}>Resolución</span>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{incident.resolution || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '22px 26px' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>Historial de la incidencia</h3>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#e2e8f0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {incident.history.map((h, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#fff', border: '2px solid #3b82f6' }} />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2a4a' }}>{h.action}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{h.date}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: h.note ? 4 : 0 }}>Por: {h.by}</div>
                  {h.note && <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', borderRadius: 6, padding: '8px 12px', borderLeft: '3px solid #dde3ec' }}>{h.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ─── Page: Assign / Manage ────────────────────────────────────────────────────

function AssignForm({ incident, user, onSave, onCancel }: {
  incident: Incident; user: User; onSave: (updated: Incident) => void; onCancel: () => void
}) {
  const [technician, setTechnician] = useState(incident.assignedTo || '')
  const [status, setStatus] = useState<Status>(incident.status)
  const [diagnosis, setDiagnosis] = useState(incident.diagnosis)
  const [resolution, setResolution] = useState(incident.resolution)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')

    const newHistory: HistoryEntry[] = [...incident.history]
    if (technician !== incident.assignedTo) {
      newHistory.push({ date: now, action: 'Técnico asignado', by: user.name, note: note || `Asignado a ${technician}` })
    }
    if (status !== incident.status) {
      newHistory.push({ date: now, action: `Estado cambiado a "${status}"`, by: user.name, note: note || '' })
    }
    if (diagnosis !== incident.diagnosis || resolution !== incident.resolution) {
      newHistory.push({ date: now, action: 'Diagnóstico actualizado', by: user.name, note: note || '' })
    }
    if (newHistory.length === incident.history.length && note) {
      newHistory.push({ date: now, action: 'Nota agregada', by: user.name, note })
    }

    const updated: Incident = { ...incident, assignedTo: technician || null, status, diagnosis, resolution, updatedAt: now, history: newHistory }
    setSaved(true)
    setTimeout(() => onSave(updated), 1000)
  }

  const fieldStyle: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 14, outline: 'none', color: '#1a2332', background: '#fff', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }

  if (saved) {
    return (
      <AppShell user={user} active="list" onNav={() => {}} title="Gestionar incidencia">
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: '#0f2a4a', margin: '0 0 8px' }}>Cambios guardados</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>La incidencia ha sido actualizada correctamente.</p>
        </div>
      </AppShell>
    )
  }

  const sc = statusColor(incident.status)

  return (
    <AppShell user={user} active="list" onNav={() => {}} title="Gestionar incidencia"
      subtitle={`${incident.id} · ${incident.title}`}
      actions={<button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>← Cancelar</button>}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Current status banner */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '16px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Estado actual</div>
            <span className={`${sc.bg} ${sc.text} ${sc.border}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid' }}>
              <span className={sc.dot} style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block' }} />
              {incident.status}
            </span>
          </div>
          <div style={{ width: 1, height: 36, background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Técnico actual</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: incident.assignedTo ? '#1a3d6b' : '#94a3b8', fontStyle: incident.assignedTo ? 'normal' : 'italic' }}>{incident.assignedTo || 'Sin asignar'}</div>
          </div>
          <div style={{ width: 1, height: 36, background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Prioridad</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: incident.priority === 'Alta' ? '#dc2626' : incident.priority === 'Media' ? '#d97706' : '#64748b' }}>{incident.priority}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Assignment */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Asignación de técnico</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {TECHNICIANS.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 8, border: `2px solid ${technician === t.name ? '#3b82f6' : '#dde3ec'}`, cursor: t.available ? 'pointer' : 'not-allowed', background: technician === t.name ? '#eff6ff' : '#fff', opacity: t.available ? 1 : 0.5, transition: 'all 0.15s' }}>
                  <input type="radio" name="technician" value={t.name} checked={technician === t.name} disabled={!t.available}
                    onChange={() => setTechnician(t.name)} style={{ display: 'none' }} />
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: technician === t.name ? '#3b82f6' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: technician === t.name ? '#fff' : '#64748b', flexShrink: 0, transition: 'all 0.15s' }}>
                    {t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2a4a' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{t.specialty}</div>
                    <div style={{ fontSize: 11, marginTop: 2, color: t.available ? '#10b981' : '#ef4444', fontWeight: 500 }}>{t.available ? 'Disponible' : 'No disponible'}</div>
                  </div>
                  {technician === t.name && <span style={{ color: '#3b82f6', fontSize: 18, flexShrink: 0 }}>✓</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Estado de la incidencia</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {(['Abierta', 'En progreso', 'Resuelta', 'Cerrada'] as Status[]).map(s => {
                const c = statusColor(s)
                const isSelected = status === s
                return (
                  <label key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', borderRadius: 8, border: `2px solid ${isSelected ? '#3b82f6' : '#dde3ec'}`, cursor: 'pointer', background: isSelected ? '#eff6ff' : '#fff', transition: 'all 0.15s' }}>
                    <input type="radio" name="status" value={s} checked={isSelected} onChange={() => setStatus(s)} style={{ display: 'none' }} />
                    <span className={c.dot} style={{ width: 12, height: 12, borderRadius: '50%', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#1d4ed8' : '#374151', textAlign: 'center' }}>{s}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Technical notes */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Informe técnico</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Diagnóstico técnico</label>
                <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3}
                  placeholder="Describe el diagnóstico del problema encontrado..."
                  style={{ ...fieldStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#dde3ec'} />
              </div>
              <div>
                <label style={labelStyle}>Solución aplicada</label>
                <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3}
                  placeholder="Describe la solución implementada para resolver la incidencia..."
                  style={{ ...fieldStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#dde3ec'} />
              </div>
              <div>
                <label style={labelStyle}>Nota adicional para el historial</label>
                <input value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Observación que quedará registrada en el historial..."
                  style={fieldStyle}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#dde3ec'} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={onCancel}
              style={{ padding: '11px 24px', borderRadius: 8, border: '1px solid #dde3ec', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ padding: '11px 28px', borderRadius: 8, border: 'none', background: '#1a3d6b', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>('login')
  const [user, setUser] = useState<User | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleLogin = (u: User) => {
    setUser(u)
    setPage('list')
  }

  const handleLogout = () => {
    setUser(null)
    setPage('login')
  }

  const handleViewIncident = (id: string) => {
    setSelectedId(id)
    setPage('detail')
  }

  const handleSaveNew = (inc: Incident) => {
    setIncidents(prev => [inc, ...prev])
    setPage('list')
  }

  const handleSaveAssignment = (updated: Incident) => {
    setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i))
    setSelectedId(updated.id)
    setPage('detail')
  }

  const selectedIncident = incidents.find(i => i.id === selectedId)

  if (page === 'login') return <LoginPage onLogin={handleLogin} />

  if (!user) return null

  if (page === 'list') {
    return <IncidentList incidents={incidents} user={user} onView={handleViewIncident} onRegister={() => setPage('register')} onLogout={handleLogout} />
  }

  if (page === 'register') {
    return <RegisterIncident user={user} onSave={handleSaveNew} onCancel={() => setPage('list')} />
  }

  if (page === 'detail' && selectedIncident) {
    return <IncidentDetail incident={selectedIncident} user={user} onBack={() => setPage('list')} onAssign={() => setPage('assign')} />
  }

  if (page === 'assign' && selectedIncident) {
    return <AssignForm incident={selectedIncident} user={user} onSave={handleSaveAssignment} onCancel={() => setPage('detail')} />
  }

  return null
}
