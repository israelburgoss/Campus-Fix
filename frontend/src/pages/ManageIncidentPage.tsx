import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIncident } from '../hooks/useIncident'
import { api, ApiError } from '../lib/api'
import { mapEstadoAUi } from '../types'
import { StatusBadge, PriorityBadge } from '../components/ui/Badges'
import { Shell } from '../components/layout/Shell'
import type { UiIncident as Incident, UiStatus as Status, Technician } from '../types'

export function ManageIncidentPage() {
  const { id } = useParams()
  const idNum = Number(id)
  const { user } = useAuth()
  const { incident, loading, reload } = useIncident(Number.isNaN(idNum) ? undefined : idNum)
  const navigate = useNavigate()

  const isAdmin = user?.role === 'administrador'
  const isTecnico = user?.role === 'tecnico'

  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [assignedToId, setAssignedToId] = useState('')
  const [status, setStatus] = useState<Status>('Abierta')
  const [diagnosis, setDiagnosis] = useState('')
  const [resolution, setResolution] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!incident) return
    setAssignedToId(incident.assignedToId ?? '')
    setStatus(incident.status)
    setDiagnosis(incident.diagnosis)
    setResolution(incident.resolution)
  }, [incident])

  useEffect(() => {
    if (!isAdmin) return
    api.reportesTecnicos()
      .then(({ datos }) => setTechnicians(datos.map(t => ({ id: String(t.id_tecnico), name: t.tecnico, specialty: 'Técnico TI', available: true }))))
      .catch(() => setTechnicians([]))
  }, [isAdmin])

  if (!user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incident) return
    setSaving(true)
    setError('')
    try {
      if (isAdmin && assignedToId && assignedToId !== (incident.assignedToId ?? '')) {
        await api.asignarTecnico(incident.idIncidencia, Number(assignedToId))
      }

      const nuevoEstado = mapEstadoAUi(status)
      if (status !== incident.status) {
        await api.cambiarEstado(incident.idIncidencia, nuevoEstado, note || undefined)
      }

      if (isTecnico) {
        await api.registrarDiagnostico(incident.idIncidencia, {
          descripcion: diagnosis,
          solucionAplicada: resolution || undefined,
        })
      }

      await reload()
      navigate(`/incidencias/${incident.idIncidencia}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron guardar los cambios')
      setSaving(false)
    }
  }

  if (loading || !incident) {
    return (
      <Shell title="Cargando...">
        <div style={{ fontSize: 14, color: '#64748b' }}>Obteniendo la incidencia...</div>
      </Shell>
    )
  }

  const i: Incident = incident

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a2332', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2a4a', marginBottom: 6 }

  return (
    <Shell title={isAdmin ? 'Asignar técnico y gestionar' : 'Registrar diagnóstico y estado'}
      subtitle={`${i.id} · ${i.title}`}
      actions={<button onClick={() => navigate(`/incidencias/${i.idIncidencia}`)} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>← Volver</button>}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '16px 22px', marginBottom: 20, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5 }}>Estado actual</div>
            <StatusBadge status={i.status} />
          </div>
          <div style={{ width: 1, height: 32, background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5 }}>Técnico asignado</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: i.assignedTo ? '#1a3d6b' : '#94a3b8', fontStyle: i.assignedTo ? 'normal' : 'italic' }}>{i.assignedTo ?? 'Sin asignar'}</div>
          </div>
          <div style={{ width: 1, height: 32, background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5 }}>Prioridad</div>
            <PriorityBadge priority={i.priority} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {isAdmin && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#7c3aed', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#faf5ff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#7c3aed', border: '1px solid #e9d5ff' }}>ADMINISTRADOR</span>
                Asignación de técnico
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px' }}>Selecciona el técnico que atenderá esta incidencia.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {technicians.length === 0 && <div style={{ fontSize: 13, color: '#94a3b8' }}>Cargando técnicos...</div>}
                {technicians.map(t => {
                  const selected = assignedToId === t.id
                  return (
                    <label key={t.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 9, border: `2px solid ${selected ? '#7c3aed' : '#dde3ec'}`, cursor: 'pointer', background: selected ? '#faf5ff' : '#fff', transition: 'all 0.15s' }}>
                      <input type="radio" name="tech" value={t.id} checked={selected} onChange={() => setAssignedToId(t.id)} style={{ display: 'none' }} />
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: selected ? '#7c3aed' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: selected ? '#fff' : '#64748b', flexShrink: 0, transition: 'all 0.15s' }}>
                        {t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2a4a' }}>{t.name}</div>
                      </div>
                      {selected && <span style={{ color: '#7c3aed', fontSize: 18, flexShrink: 0, fontWeight: 700 }}>✓</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {isTecnico && <span style={{ background: '#f0fdf4', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#15803d', border: '1px solid #bbf7d0' }}>TÉCNICO</span>}
              Cambiar estado
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px' }}>
              {isTecnico ? 'Actualiza el estado según el avance de la atención.' : 'Actualiza el estado general de la incidencia.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {(['Abierta', 'En progreso', 'Resuelta', 'Cerrada'] as Status[]).map(s => {
                const c = statusColor(s)
                const isSelected = status === s
                return (
                  <label key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 10px', borderRadius: 8, border: `2px solid ${isSelected ? c.border : '#e2e8f0'}`, cursor: 'pointer', background: isSelected ? c.bg : '#fff', transition: 'all 0.15s' }}>
                    <input type="radio" name="status" value={s} checked={isSelected} onChange={() => setStatus(s)} style={{ display: 'none' }} />
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.dot, display: 'block' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? c.text : '#374151', textAlign: 'center', lineHeight: 1.3 }}>{s}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f2a4a', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {isTecnico && <span style={{ background: '#f0fdf4', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#15803d', border: '1px solid #bbf7d0' }}>TÉCNICO</span>}
              Informe técnico
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px' }}>
              {isTecnico ? 'Registra el diagnóstico técnico y la solución aplicada.' : 'Revisa o edita el informe técnico de la incidencia.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={lbl}>Diagnóstico técnico</label>
                <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3}
                  placeholder="Describe el problema detectado, sus causas y hallazgos durante la revisión..."
                  style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
              </div>
              <div>
                <label style={lbl}>Solución aplicada / Resolución</label>
                <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3}
                  placeholder="Describe la solución implementada, pasos realizados y resultado final..."
                  style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
              </div>
              <div>
                <label style={lbl}>Nota para el historial</label>
                <input value={note} onChange={e => setNote(e.target.value)} style={inp}
                  placeholder="Observación adicional que quedará registrada en el seguimiento..."
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
              </div>
            </div>
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => navigate(`/incidencias/${i.idIncidencia}`)}
              style={{ padding: '11px 24px', borderRadius: 8, border: '1px solid #dde3ec', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '11px 28px', borderRadius: 8, border: 'none', background: isAdmin ? '#7c3aed' : '#0f2a4a', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  )
}

function statusColor(status: Status) {
  switch (status) {
    case 'Abierta':     return { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', border: '#fecaca' }
    case 'En progreso': return { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b', border: '#fde68a' }
    case 'Resuelta':    return { bg: '#ecfdf5', text: '#059669', dot: '#10b981', border: '#a7f3d0' }
    case 'Cerrada':     return { bg: '#f8fafc', text: '#64748b', dot: '#94a3b8', border: '#e2e8f0' }
  }
}
