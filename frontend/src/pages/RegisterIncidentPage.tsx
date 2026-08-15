import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api, ApiError } from '../lib/api'
import { Shell } from '../components/layout/Shell'
import type { Category, Prioridad } from '../types'

export function RegisterIncidentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: 'Hardware' as Category, priority: 'Media' as Prioridad, location: '', equipment: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('El título y la descripción son obligatorios')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.registrarIncidencia({ titulo: form.title.trim(), descripcion: form.description.trim(), prioridad: form.priority })
      navigate('/incidencias')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la incidencia')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a2332', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }

  return (
    <Shell title="Registrar nueva incidencia" subtitle="Describe el problema tecnológico que necesitas reportar"
      actions={<button onClick={() => navigate('/incidencias')} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>Cancelar</button>}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Descripción del problema</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={lbl}>Título <span style={{ color: '#ef4444' }}>*</span></label>
                <input required value={form.title} onChange={e => set('title', e.target.value)} style={inp}
                  placeholder="Ej: Computadora del laboratorio A2 no enciende"
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
              </div>
              <div>
                <label style={lbl}>Descripción detallada <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={4}
                  placeholder="Describe el problema: cuándo ocurrió, qué estabas haciendo, mensajes de error, si es recurrente..."
                  style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
                </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>Categoría <span style={{ color: '#ef4444' }}>*</span></label>
                  <select required value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
                    <option>Hardware</option><option>Software</option><option>Red</option>
                    <option>Impresión</option><option>Acceso</option><option>Otro</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Prioridad percibida <span style={{ color: '#ef4444' }}>*</span></label>
                  <select required value={form.priority} onChange={e => set('priority', e.target.value)} style={inp}>
                    <option>Alta</option><option>Media</option><option>Baja</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Ubicación y equipo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={lbl}>Ubicación física</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} style={inp}
                  placeholder="Ej: Laboratorio A2 – Pabellón A, Piso 2"
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
              </div>
              <div>
                <label style={lbl}>Equipo o sistema afectado</label>
                <input value={form.equipment} onChange={e => set('equipment', e.target.value)} style={inp}
                  placeholder="Ej: PC HP ProDesk 400, código de inventario INV-2891"
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
              </div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', padding: '16px 20px', fontSize: 13, color: '#1d4ed8' }}>
            <strong>Datos del solicitante:</strong> {user.name} · {user.email} · Cód. {user.code}
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => navigate('/incidencias')}
              style={{ padding: '11px 24px', borderRadius: 8, border: '1px solid #dde3ec', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: '11px 28px', borderRadius: 8, border: 'none', background: loading ? '#93c5fd' : '#1a3d6b', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              {loading ? 'Registrando...' : 'Registrar incidencia →'}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  )
}
