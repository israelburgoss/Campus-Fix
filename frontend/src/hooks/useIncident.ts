import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { toUiIncidentDetalle } from '../types'
import type { UiIncident } from '../types'

export function useIncident(id: number | undefined) {
  const [incident, setIncident] = useState<UiIncident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (id == null) return
    setLoading(true)
    setError('')
    try {
      const { incidencia } = await api.detalleIncidencia(id)
      setIncident(toUiIncidentDetalle(incidencia))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la incidencia')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    reload()
  }, [reload])

  return { incident, loading, error, reload }
}
