import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIncident } from '../hooks/useIncident'
import { StatusBadge, PriorityBadge } from '../components/ui/Badges'
import { Shell } from '../components/layout/Shell'
import type { UiIncident as Incident, UiStatus as Status } from '../types'

export function IncidentDetailPage() {
  const { id } = useParams()
  const idNum = Number(id)
  const { user } = useAuth()
  const { incident, loading, error, reload } = useIncident(Number.isNaN(idNum) ? undefined : idNum)
  const navigate = useNavigate()

  if (!user) return null

  if (loading) {
    return (
      <Shell title="Cargando...">
        <div style={{ fontSize: 14, color: '#64748b' }}>Obteniendo la incidencia...</div>
      </Shell>
    )
  }

  if (!incident) {
    return (
      <Shell title="Incidencia" subtitle="No encontrada"
        actions={<button onClick={() => navigate('/incidencias')} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>← Volver</button>}>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: 24, color: '#64748b', fontSize: 14 }}>
          {error || 'No se pudo cargar la incidencia solicitada.'}
        </div>
      </Shell>
    )
  }

  const i: Incident = incident
  const canManage =
    (user.role === 'administrador') ||
    (user.role === 'tecnico' && i.assignedToId === user.id && (i.status === 'En progreso' || i.status === 'Abierta'))

  const InfoField = ({ label, value }: { label: string; value: string }) => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1a2332', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  )

  return (
    <Shell title={i.id} subtitle={i.title}
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/incidencias')} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>
            ← Volver
          </button>
          {canManage && (
            <button onClick={() => navigate(`/incidencias/${i.idIncidencia}/gestionar`)}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: user.role === 'administrador' ? '#7c3aed' : '#0f2a4a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {user.role === 'administrador' ? 'Asignar / Gestionar' : 'Registrar diagnóstico'}
            </button>
          )}
        </div>
      }
    >
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: '#0f2a4a', margin: '0 0 10px' }}>{i.title}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#3b82f6', fontWeight: 700, background: '#eff6ff', padding: '3px 10px', borderRadius: 5 }}>{i.id}</span>
                <StatusBadge status={i.status as Status} />
                <PriorityBadge priority={i.priority} />
                <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '3px 9px', borderRadius: 5 }}>{i.category}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
              <div>Creado: {i.createdAt}</div>
              <div>Actualizado: {i.updatedAt}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Descripción</div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{i.description}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f2a4a', margin: 0, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Datos del reporte</h3>
            <InfoField label="Reportado por" value={`${i.reportedBy} (${i.reportedRole})`} />
            <InfoField label="Ubicación" value={i.location} />
            <InfoField label="Equipo afectado" value={i.equipment} />
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f2a4a', margin: 0, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Atención técnica</h3>
            <InfoField label="Técnico asignado" value={i.assignedTo ?? 'Sin asignar'} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>Diagnóstico</div>
              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{i.diagnosis || '—'}</p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>Resolución</div>
              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{i.resolution || '—'}</p>
            </div>
          </div>
        </div>

        {i.evidencias && i.evidencias.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '22px 26px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f2a4a', margin: '0 0 16px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Evidencias</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {i.evidencias.map((ev, idx) => (
                <a key={idx} href={ev.url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, color: '#1a3d6b', textDecoration: 'none', fontWeight: 600 }}>
                  <span style={{ textTransform: 'uppercase', fontSize: 10, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>{ev.tipo}</span>
                  {ev.nombre || ev.url}
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '22px 26px' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f2a4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            Historial de seguimiento
          </h3>
          <div style={{ position: 'relative', paddingLeft: 28 }}>
            <div style={{ position: 'absolute', left: 9, top: 10, bottom: 10, width: 2, background: '#e2e8f0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {i.history.map((h, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -24, top: 3, width: 12, height: 12, borderRadius: '50%', background: '#fff', border: '2.5px solid #3b82f6' }} />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2a4a' }}>{h.action}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{h.date}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: h.note ? 6 : 0 }}>Por: {h.by}</div>
                  {h.note && <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', borderRadius: 6, padding: '8px 12px', borderLeft: '3px solid #dde3ec' }}>{h.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {user.role === 'estudiante' && (i.status === 'Abierta' || i.status === 'En progreso') && (
          <div style={{ background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', padding: '14px 18px', fontSize: 13, color: '#92400e' }}>
            Tu incidencia está siendo atendida. Recibirás actualizaciones en el historial de seguimiento.
          </div>
        )}

        <button onClick={() => reload()} style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>
          Actualizar datos
        </button>
      </div>
    </Shell>
  )
}
