import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { RequireRole } from './components/auth/RequireRole'
import { LoginPage } from './pages/LoginPage'
import { IncidentsListPage } from './pages/IncidentsListPage'
import { IncidentDetailPage } from './pages/IncidentDetailPage'
import { RegisterIncidentPage } from './pages/RegisterIncidentPage'
import { ManageIncidentPage } from './pages/ManageIncidentPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/incidencias" element={<IncidentsListPage />} />
          <Route path="/incidencias/nueva" element={<RequireRole roles="estudiante"><RegisterIncidentPage /></RequireRole>} />
          <Route path="/incidencias/:id" element={<IncidentDetailPage />} />
          <Route path="/incidencias/:id/gestionar" element={<RequireRole roles={['administrador', 'tecnico']}><ManageIncidentPage /></RequireRole>} />
        </Route>
        <Route path="*" element={<Navigate to="/incidencias" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
