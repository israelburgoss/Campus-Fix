import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../lib/api'
import type { UiRol } from '../types'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/incidencias" replace />

  const demos = [
    { label: 'Administrador', sub: 'Carlos Mendoza', email: 'carlos.mendoza@ecotec.edu.ec', role: 'administrador' as UiRol },
    { label: 'Técnico TI', sub: 'Andrés Vera', email: 'andres.vera@ecotec.edu.ec', role: 'tecnico' as UiRol },
    { label: 'Estudiante', sub: 'Juan Pérez', email: 'juan.perez@ecotec.edu.ec', role: 'estudiante' as UiRol },
  ]
  const roleColors: Record<UiRol, string> = { estudiante: '#3b82f6', tecnico: '#10b981', administrador: '#8b5cf6' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!email || !password) {
      setLocalError('Ingresa tu correo y contraseña')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/incidencias')
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #dde3ec', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a2332', background: '#fff', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ background: '#0f2a4a', display: 'flex', flexDirection: 'column', padding: '52px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 21, color: '#fff' }}>CampusFix</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>Universidad Tecnológica</div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 40, color: '#fff', lineHeight: 1.12, margin: '0 0 18px' }}>Sistema de<br />Gestión de<br />Incidencias TI</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 52px', maxWidth: 340 }}>
            Plataforma centralizada para el registro, seguimiento y resolución de incidencias tecnológicas del campus universitario.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { role: 'Estudiante', desc: 'Registra y consulta tus incidencias', color: '#3b82f6' },
              { role: 'Técnico TI', desc: 'Gestiona diagnósticos y actualiza estados', color: '#10b981' },
              { role: 'Administrador', desc: 'Supervisa todo y asigna técnicos', color: '#8b5cf6' },
            ].map(r => (
              <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.role}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>— {r.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 52, background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 28, margin: '0 0 6px', color: '#0f2a4a' }}>Iniciar sesión</h1>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: '#64748b' }}>Ingresa con tus credenciales institucionales</p>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 26, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 12 }}>Acceso rápido (demo · contraseña: CampusFix2026!)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {demos.map(d => (
                <button key={d.email} onClick={() => { setEmail(d.email); setPassword('CampusFix2026!') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: `1px solid ${email === d.email ? roleColors[d.role] : '#e2e8f0'}`, background: email === d.email ? `${roleColors[d.role]}10` : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: roleColors[d.role], flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2a4a' }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{d.sub} · {d.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }}>Correo institucional</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="usuario@ecotec.edu.ec" style={inp}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" style={inp}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
            </div>
            {(localError) && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{localError}</div>}
            <button type="submit" disabled={loading}
              style={{ padding: 13, borderRadius: 8, border: 'none', background: loading ? '#93c5fd' : '#1a3d6b', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
