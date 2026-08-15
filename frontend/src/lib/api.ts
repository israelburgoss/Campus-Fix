/// <reference types="vite/client" />
import { getToken } from './auth'
import type {
  ApiUsuario,
  ApiIncidenciaList,
  ApiIncidenciaDetalle,
  ApiEvidencia,
} from '../types'

const BASE: string = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    let message = 'Ocurrió un error inesperado'
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status)
  }
  return res.json() as Promise<T>
}

export interface TecnicoResumen {
  id_tecnico: number
  tecnico: string
  total_incidencias: number
  incidencias_activas: number
  incidencias_resueltas: number
  funcion_incidencias_activas: number
}

export const api = {
  login: (correo: string, contrasena: string) =>
    request<{ success: boolean; token: string; usuario: ApiUsuario }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, contrasena }),
    }),

  me: () =>
    request<{ success: boolean; usuario: ApiUsuario }>('/api/auth/me'),

  listarIncidencias: (estado?: string, prioridad?: string) => {
    const params = new URLSearchParams()
    if (estado) params.set('estado', estado)
    if (prioridad) params.set('prioridad', prioridad)
    const q = params.toString()
    return request<{ success: boolean; incidencias: ApiIncidenciaList[] }>(
      `/api/incidencias${q ? `?${q}` : ''}`
    )
  },

  detalleIncidencia: (id: number) =>
    request<{ success: boolean; incidencia: ApiIncidenciaDetalle }>(`/api/incidencias/${id}`),

  registrarIncidencia: (body: {
    titulo: string
    descripcion: string
    prioridad: string
    id_activo?: number | null
  }) =>
    request<{ success: boolean; id_incidencia: number; codigo: string }>('/api/incidencias', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  asignarTecnico: (id: number, id_tecnico: number) =>
    request(`/api/incidencias/${id}/asignar`, {
      method: 'PUT',
      body: JSON.stringify({ id_tecnico }),
    }),

  cambiarEstado: (id: number, estado: string, comentario?: string) =>
    request(`/api/incidencias/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado, comentario }),
    }),

  registrarDiagnostico: (
    id: number,
    body: {
      descripcion: string
      pruebasRealizadas?: string[]
      causaProbable?: string
      solucionAplicada?: string
    }
  ) =>
    request(`/api/incidencias/${id}/diagnosticos`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  reportesTecnicos: () =>
    request<{ success: boolean; datos: TecnicoResumen[] }>('/api/reportes/tecnicos'),
}

export type { ApiEvidencia }
