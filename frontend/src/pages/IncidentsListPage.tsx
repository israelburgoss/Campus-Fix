import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIncidents } from '../hooks/useIncidents'
import { StatusBadge, PriorityBadge } from '../components/ui/Badges'
import { Shell } from '../components/layout/Shell'
import type { UiIncident as Incident, UiStatus as Status, UiRol as Role } from '../types'

export function IncidentsListPage() {
  const { user } = useAuth()
  const { incidents, loading, reload } = useIncidents()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'Todas'>('Todas')

  if (!user) return null

  const roleFiltered = incidents.filter(i => {
    if (user.role === 'estudiante') return i.reportedBy === user.name
    if (user.role === 'tecnico') return i.assignedTo === user.name
    return true
  })

  const displayed = roleFiltered.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'Todas' || i.status === filterStatus
    return matchSearch && matchStatus
  })

  const subtitleMap: Record<Role, string> = {
    estudiante: 'Mis incidencias registradas',
    tecnico: 'Incidencias asignadas a mí',
    administrador: 'Todas las incidencias del sistema',
  }

  const statsAll = {
    total: roleFiltered.length,
    abiertas: roleFiltered.filter(i => i.status === 'Abierta').length,
    enProgreso: roleFiltered.filter(i => i.status === 'En progreso').length,
    resueltas: roleFiltered.filter(i => i.status === 'Resuelta').length,
  }

  return (
    <Shell title="Incidencias" subtitle={subtitleMap[user.role]}
      actions={
        user.role === 'estudiante'
          ? <button onClick={() => navigate('/incidencias/nueva')} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1a3d6b', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Nueva incidencia</button>
          : null
      }
    >
      {loading && <div style={{ marginBottom: 16, fontSize: 13, color: '#64748b' }}>Cargando incidencias...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total', value: statsAll.total, color: '#0f2a4a' },
          { label: 'Abiertas', value: statsAll.abiertas, color: '#dc2626' },
          { label: 'En progreso', value: statsAll.enProgreso, color: '#d97706' },
          { label: 'Resueltas', value: statsAll.resueltas, color: '#059669' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '18px 22px', border: '1px solid #dde3ec' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 34, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1px solid #dde3ec', marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por ID o título..."
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a2332' }}
          onFocus={e => (e.target.style.borderColor = '#3b82f6')}
          onBlur={e => (e.target.style.borderColor = '#dde3ec')} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Status | 'Todas')}
          style={{ padding: '8px 12px', borderRadius: 7, border: '1.5px solid #dde3ec', fontSize: 13, outline: 'none', color: '#1a2332', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
          <option value="Todas">Todos los estados</option>
          <option>Abierta</option><option>En progreso</option><option>Resuelta</option><option>Cerrada</option>
        </select>
        <button onClick={() => reload()} style={{ padding: '8px 14px', borderRadius: 7, border: '1.5px solid #dde3ec', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#475569' }}>Actualizar</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f7fa', borderBottom: '1px solid #e2e8f0' }}>
              {['ID', 'Incidencia', 'Categoría', 'Prioridad', 'Estado',
                user.role !== 'estudiante' ? 'Reportado por' : null,
                user.role !== 'tecnico' ? 'Técnico' : null,
                'Fecha', ''].filter(Boolean).map(h => (
                <th key={h!} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 52, color: '#94a3b8', fontSize: 14 }}>
                {user.role === 'estudiante' ? 'No tienes incidencias registradas aún.' : 'No hay incidencias que mostrar.'}
              </td></tr>
            )}
            {displayed.map(inc => (
              <tr key={inc.idIncidencia} onClick={() => navigate(`/incidencias/${inc.idIncidencia}`)}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                <td style={{ padding: '13px 14px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6', fontWeight: 700, background: '#eff6ff', padding: '3px 8px', borderRadius: 5 }}>{inc.id}</span>
                </td>
                <td style={{ padding: '13px 14px', maxWidth: 260 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2a4a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{inc.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{inc.location}</div>
                </td>
                <td style={{ padding: '13px 14px' }}>
                  <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '3px 9px', borderRadius: 5 }}>{inc.category}</span>
                </td>
                <td style={{ padding: '13px 14px' }}><PriorityBadge priority={inc.priority} /></td>
                <td style={{ padding: '13px 14px' }}><StatusBadge status={inc.status} /></td>
                {user.role !== 'estudiante' && (
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{inc.reportedBy}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{inc.reportedRole}</div>
                  </td>
                )}
                {user.role !== 'tecnico' && (
                  <td style={{ padding: '13px 14px', fontSize: 12, color: inc.assignedTo ? '#1a3d6b' : '#94a3b8', fontStyle: inc.assignedTo ? 'normal' : 'italic', fontWeight: inc.assignedTo ? 500 : 400 }}>
                    {inc.assignedTo ?? 'Sin asignar'}
                  </td>
                )}
                <td style={{ padding: '13px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{inc.createdAt}</td>
                <td style={{ padding: '13px 14px' }}>
                  <button onClick={e => { e.stopPropagation(); navigate(`/incidencias/${inc.idIncidencia}`) }}
                    style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #dde3ec', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#1a3d6b', fontWeight: 600 }}>
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user.role === 'administrador' && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff', fontSize: 13, color: '#7c3aed' }}>
          Como administrador puedes ver todas las incidencias. Haz clic en una para asignar técnico o revisar detalles.
        </div>
      )}
    </Shell>
  )
}
