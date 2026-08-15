// Tipos de la API de Campus-Fix y mapeo al modelo de UI.

export type ApiRol = 'Administrador' | 'Tecnico' | 'Usuario'
export type UiRol = 'administrador' | 'tecnico' | 'estudiante'
export type ApiEstado = 'Registrada' | 'Asignada' | 'En proceso' | 'Resuelta'
export type UiStatus = 'Abierta' | 'En progreso' | 'Resuelta' | 'Cerrada'
export type Prioridad = 'Alta' | 'Media' | 'Baja'

export type Category = 'Hardware' | 'Software' | 'Red' | 'Impresión' | 'Acceso' | 'Otro'

export interface Technician {
  id: string
  name: string
  specialty: string
  available: boolean
}

export function mapRol(rol: ApiRol): UiRol {
  return rol === 'Administrador' ? 'administrador' : rol === 'Tecnico' ? 'tecnico' : 'estudiante'
}

export function mapEstadoAUi(e: ApiEstado): UiStatus
export function mapEstadoAUi(e: UiStatus): ApiEstado
export function mapEstadoAUi(e: ApiEstado | UiStatus): UiStatus | ApiEstado {
  if (e === 'En proceso') return 'En progreso'
  if (e === 'Resuelta') return 'Resuelta'
  if (e === 'Registrada' || e === 'Asignada') return 'Abierta'
  if (e === 'Abierta' || e === 'Cerrada') return 'Registrada'
  return 'Abierta'
}

export interface ApiUsuario {
  id_usuario: number
  nombres: string
  apellidos: string
  correo: string
  rol: ApiRol
  activo?: boolean
}

export interface ApiIncidenciaList {
  id_incidencia: number
  codigo: string
  titulo: string
  descripcion: string
  prioridad: Prioridad
  estado: ApiEstado
  reportante: string | null
  activo: string | null
  ubicacion: string | null
  fecha_registro: string
  fecha_actualizacion: string
  dias_transcurridos: number
  tecnico: string | null
}

export interface ApiHistorial {
  id_historial: number
  estado: string
  usuario: string
  fecha_cambio: string
  comentario: string | null
}

export interface ApiDiagnostico {
  _id?: string
  incidenciaId: number
  tecnicoId: number
  descripcion: string
  pruebasRealizadas?: string[]
  causaProbable?: string
  solucionAplicada?: string
  fecha: string
}

export interface ApiEvidencia {
  _id?: string
  incidenciaId: number
  tipo: string
  nombre?: string
  url: string
  descripcion?: string
  fecha: string
}

export interface ApiIncidenciaDetalle {
  id_incidencia: number
  codigo: string
  titulo: string
  descripcion: string
  prioridad: Prioridad
  estado: ApiEstado
  id_reportante: number
  reportante: string
  id_activo: number | null
  activo: string | null
  codigo_inventario: string | null
  estado_activo: string | null
  id_ubicacion: number | null
  ubicacion: string | null
  tipo_ubicacion: string | null
  edificio: string | null
  id_tecnico: number | null
  tecnico: string | null
  fecha_registro: string
  fecha_actualizacion: string
  historial: ApiHistorial[]
  diagnosticos: ApiDiagnostico[]
  evidencias: ApiEvidencia[]
}

export interface UiUser {
  id: string
  name: string
  role: UiRol
  email: string
  code: string
}

export interface UiHistory {
  date: string
  action: string
  by: string
  note: string
}

export interface UiIncident {
  idIncidencia: number
  id: string
  title: string
  description: string
  category: string
  priority: Prioridad
  status: UiStatus
  reportedById: string
  reportedBy: string
  reportedRole: string
  location: string
  equipment: string
  createdAt: string
  updatedAt: string
  assignedToId: string | null
  assignedTo: string | null
  diagnosis: string
  resolution: string
  history: UiHistory[]
  evidencias?: ApiEvidencia[]
}

export function toUiUser(u: ApiUsuario): UiUser {
  return {
    id: String(u.id_usuario),
    name: `${u.nombres} ${u.apellidos}`.trim(),
    role: mapRol(u.rol),
    email: u.correo,
    code: `USR-${u.id_usuario}`,
  }
}

export function toUiIncidentList(i: ApiIncidenciaList): UiIncident {
  return {
    idIncidencia: i.id_incidencia,
    id: i.codigo,
    title: i.titulo,
    description: i.descripcion,
    category: 'Otro',
    priority: i.prioridad,
    status: mapEstadoAUi(i.estado),
    reportedById: '',
    reportedBy: i.reportante ?? '',
    reportedRole: 'Estudiante',
    location: i.ubicacion ?? '',
    equipment: i.activo ?? '',
    createdAt: i.fecha_registro,
    updatedAt: i.fecha_actualizacion,
    assignedToId: null,
    assignedTo: i.tecnico ?? null,
    diagnosis: '',
    resolution: '',
    history: [],
  }
}

export function toUiIncidentDetalle(d: ApiIncidenciaDetalle): UiIncident {
  const diag = d.diagnosticos?.[d.diagnosticos.length - 1]
  return {
    idIncidencia: d.id_incidencia,
    id: d.codigo,
    title: d.titulo,
    description: d.descripcion,
    category: 'Otro',
    priority: d.prioridad,
    status: mapEstadoAUi(d.estado),
    reportedById: String(d.id_reportante),
    reportedBy: d.reportante,
    reportedRole: 'Estudiante',
    location: d.ubicacion ?? '',
    equipment: d.activo ?? '',
    createdAt: d.fecha_registro,
    updatedAt: d.fecha_actualizacion,
    assignedToId: d.id_tecnico != null ? String(d.id_tecnico) : null,
    assignedTo: d.tecnico ?? null,
    diagnosis: diag?.descripcion ?? '',
    resolution: diag?.solucionAplicada ?? '',
    history: (d.historial ?? []).map((h) => ({
      date: h.fecha_cambio,
      action: `Estado: ${h.estado}`,
      by: h.usuario,
      note: h.comentario ?? '',
    })),
    evidencias: d.evidencias ?? [],
  }
}
