import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { toUiIncidentList } from '../types'
import type { UiIncident } from '../types'

export function useIncidents() {
  const [incidents, setIncidents] = useState<UiIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { incidencias } = await api.listarIncidencias()
      setIncidents(incidencias.map(toUiIncidentList))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las incidencias')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { incidents, loading, error, reload }
}
