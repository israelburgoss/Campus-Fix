# Campus-Fix — Documentación de desarrollo

> Documento vivo que registra el progreso del proyecto por fases, las decisiones técnicas
> tomadas y la guía de ejecución. Está pensado para que un nuevo integrante del equipo
> entienda qué se ha construido, cómo funciona y qué falta.

## 1. Contexto general

**Campus-Fix** es una plataforma de gestión de incidencias tecnológicas para un campus
universitario. Consta de:

- **Backend**: API REST con Node.js + Express.js (JavaScript, ESM), MySQL + MongoDB.
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 (prototipo con mock data).
- **Bases de datos**: ya diseñadas y pobladas con scripts en `database/` (fuente de verdad).

El desarrollo se realiza **por fases**. Cada fase concluye con pruebas verificadas.

---

## 2. Stack y arquitectura

| Capa | Tecnología |
|---|---|
| Runtime | Node.js v24, `pnpm@11.17.0` (workspace monorepo) |
| Backend | Express 5, JavaScript (ESM, `"type": "module"`) |
| MySQL | `mysql2` (pool de promesas, consultas parametrizadas) |
| MongoDB | driver oficial `mongodb` (singleton) |
| Autenticación | `jsonwebtoken` (JWT) + `bcryptjs` (hash) |
| Validación | `zod` |
| Otros | `cors`, `dotenv`, `multer` (evidencias), `nodemon` (dev) |

Arquitectura del backend (por capas, según `AGENTS.md`):

```
routes → controllers → services → MySQL / MongoDB
                       ↑
                  middleware (auth, role, error)
```

---

## 3. Estructura del repositorio

```
Campus-Fix/
├── backend/
│   ├── .env                  # credenciales locales (NO se commitea)
│   ├── .env.example          # plantilla pública (sí se commitea)
│   ├── package.json          # manifiesto del backend (ESM)
│   ├── scripts/
│   │   ├── setup-passwords.js# regenera hashes bcrypt reales
│   │   ├── test-fase4.mjs    # pruebas del ciclo de vida de incidencias
│   │   └── test-fase5.mjs    # pruebas de reportes
│   └── src/
│       ├── app.js            # Express: rutas, CORS, errores, arranque
│       ├── config/           # env.js, mysql.js, mongodb.js
│       ├── controllers/      # auth, incidencias, reportes
│       ├── middleware/       # auth, role, error
│       ├── routes/           # auth, incidencias, reportes
│       └── services/         # auth, incidencias, reportes
├── database/                 # scripts SQL + MongoDB (fuente de verdad)
├── docs/
│   └── PROGRESO.md           # este documento
├── frontend/                 # React + Vite (prototipo con mock data)
├── postman/                  # colección + environment de pruebas de API
├── package.json              # workspace root (solo mongosh)
└── pnpm-workspace.yaml       # declara packages: [backend, frontend]
```

---

## 4. Cambios realizados (Fases 0 a 3)

### Fase 0 — Workspace y entorno ✅

**Objetivo**: convertir el proyecto en un workspace real de pnpm y dejar el backend arrancable.

| Archivo | Acción | Detalle |
|---|---|---|
| `pnpm-workspace.yaml` | Editado | `packages: [backend, frontend]` → lockfile unificado en el root. Se eliminó `allowBuilds` (inerte con `ignore-scripts=true`). |
| `backend/package.json` | Nuevo | ESM (`"type": "module"`), scripts `dev` (nodemon) y `start`. Dependencias de todo el backend. |
| `package.json` (root) | Editado | Se movieron `dotenv` y `nodemon` al backend. Root conserva solo `mongosh` y `packageManager`. |
| `backend/.env.example` | Nuevo | Plantilla pública de variables (placeholders, se commitea). |
| `backend/.env` | Nuevo | Valores locales reales de conexión (ignorado por git). |
| `backend/src/app.js` | Creado | Skeleton Express mínimo con `GET /api/health`. |
| `frontend/pnpm-lock.yaml` | Eliminado | Obsoleto al unificarse el workspace. |

**Verificación**: `pnpm install` OK (3 proyectos), backend y frontend arrancan.

### Fase 1 — Infraestructura del backend ✅

**Objetivo**: conexiones a ambas bases, errores uniformes y health funcional.

| Archivo | Acción | Detalle |
|---|---|---|
| `src/config/env.js` | Nuevo | Centraliza configuración desde `.env` con valores por defecto. |
| `src/config/mysql.js` | Nuevo | Pool MySQL (`mysql2/promise`, límite 10, `decimalNumbers`, `dateStrings`) + `testMysqlConnection()`. |
| `src/config/mongodb.js` | Nuevo | Cliente MongoDB singleton (`connectMongo()`) + `testMongoConnection()` (ping). |
| `src/middleware/error.middleware.js` | Nuevo | `notFoundHandler` (404) y `errorHandler` (`{success, message}`, oculta detalles 5xx en producción). |
| `src/app.js` | Actualizado | Health verifica `SELECT 1` (MySQL) + `ping` (MongoDB); se montan 404 y error global. |

**Verificación**: `GET /api/health` → `200` con `{mysql: true, mongodb: true}`.

### Fase 2 — Autenticación y seguridad ✅

**Objetivo**: login real con hash bcrypt + JWT, y protección de rutas por rol.

| Archivo | Acción | Detalle |
|---|---|---|
| `src/services/auth.service.js` | Nuevo | `login()`: busca por correo (parametrizado), valida `activo`, `bcrypt.compare`, emite JWT. Mensaje genérico 401. Nunca expone `contrasena_hash`. `perfil()` para `/me`. |
| `src/middleware/auth.middleware.js` | Nuevo | `authenticate`: exige `Authorization: Bearer`, verifica firma/expiración, adjunta `req.user`. |
| `src/middleware/role.middleware.js` | Nuevo | `authorize(...roles)`: 401 sin autenticar, 403 sin el rol requerido. |
| `src/controllers/auth.controller.js` | Nuevo | `login` (valida body con zod) y `me` (perfil del autenticado). |
| `src/routes/auth.routes.js` | Nuevo | `POST /api/auth/login` (público) y `GET /api/auth/me` (protegido). |
| `scripts/setup-passwords.js` | Nuevo | Regenera hashes bcrypt reales con la contraseña por defecto para todos los usuarios. |
| `src/app.js` | Actualizado | Monta el router `/api/auth`. |

**Verificación**: 16/16 pruebas PASS + token expirado/secreto incorrecto → 401.

### Fase 3 — Incidencias: registro y listado ✅

**Objetivo**: registrar incidencias usando `sp_registrar_incidencia` y listarlas con filtros.

| Archivo | Acción | Detalle |
|---|---|---|
| `src/services/incidencias.service.js` | Nuevo | `generarCodigo()` (patrón `INC-AAAA-XXXX`), `registrar()` (llama al SP → estado inicial `Registrada`), `listar()` (JOIN reportante/activo/ubicación/técnico + `fn_dias_transcurridos` + filtros parametrizados). Mapea errores del SP a 400/409. |
| `src/middleware/error.middleware.js` | Modificado | Convierte `ZodError` en 400 de forma global. |
| `src/controllers/incidencias.controller.js` | Nuevo | Valida con zod; `id_usuario_reporta` se toma del token (evita suplantación); registro → 201. |
| `src/routes/incidencias.routes.js` | Nuevo | `POST /` y `GET /api/incidencias`, protegidas. |
| `src/app.js` | Actualizado | Monta el router `/api/incidencias`. |

**Verificación**: 13/13 pruebas PASS + SP rechaza usuario inactivo (400).

### Fase 4 — Detalle integrado, asignación, estado, diagnóstico y evidencia ✅

**Objetivo**: completar el ciclo de vida de una incidencia integrando MySQL y MongoDB.

| Archivo | Acción | Detalle |
|---|---|---|
| `src/services/incidencias.service.js` | Ampliado | `detalle()` (MySQL: incidencia + reportante + activo + ubicación + técnico + `historial` vía JOIN; MongoDB: `diagnosticos` y `evidencias` por `incidenciaId`, orden desc). `asignar()` → `sp_asignar_tecnico` (misma conexión, setea `@campusfix_*` por si el SP no lo hace). `cambiarEstado()` → `sp_cambiar_estado`; valida RN-05 (cuenta diagnósticos en Mongo antes de `Resuelta`) y restringe `En proceso`/`Resuelta` al técnico asignado o Administrador. `registrarDiagnostico()` (exige técnico asignado, inserta en `diagnosticos` respetando `$jsonSchema`). `registrarEvidencia()` (inserta en `evidencias`, `tipo` validado en ruta). Helpers `validarIncidenciaExiste`, `idInvalidoError`, `normalizarError` (mapea "no existe" → 404). |
| `src/controllers/incidencias.controller.js` | Ampliado | zod `asignarSchema`, `cambiarEstadoSchema`, `diagnosticoSchema`, `evidenciaSchema`; helper `parseId` (entero positivo → 400). Controladores `detalle`, `asignar`, `cambiarEstado`, `registrarDiagnostico`, `registrarEvidencia`. |
| `src/routes/incidencias.routes.js` | Ampliado | `GET /:id` (auth), `PUT /:id/asignar` (auth + `authorize('Administrador')`), `PUT /:id/estado` (auth), `POST /:id/diagnosticos` (auth; servicio valida técnico), `POST /:id/evidencias` (auth + `authorize('Tecnico','Administrador')`). |

**Notas técnicas**:
- `asignar` y `cambiarEstado` abren una conexión dedicada (`pool.getConnection()`) para que las variables de sesión `@campusfix_usuario_cambio` / `@campusfix_comentario` que consume el trigger de historial y el SP se ejecuten en la **misma conexión**.
- RN-04 la garantiza el SP (`sp_cambiar_estado` exige técnico para `En proceso`); el backend además bloquea (403) que un usuario distinto al técnico asignado avance a `En proceso`/`Resuelta`.
- RN-05 la valida el backend consultando MongoDB antes de llamar al SP.

**Verificación**: `scripts/test-fase4.mjs` → **23/23 PASS** (registro → detalle vacío → 403 asignar como usuario → asignar admin → En proceso → 400 Resuelta sin diagnóstico (RN-05) → 403 diagnóstico como no asignado → diagnóstico técnico → Resuelta → detalle con Mongo + historial → evidencia → 400 tipo inválido → 400 estado inválido → 400 id no numérico → 404 id inexistente → 401 sin token). Limpieza automática de la incidencia de prueba (incluye `historial_estados` y Mongo).

### Fase 5 — Reportes ✅

**Objetivo**: exponer reportes de incidencias reutilizando estructura SQL existente.

| Archivo | Acción | Detalle |
|---|---|---|
| `src/services/reportes.service.js` | Nuevo | `porEstado()`: `estados_incidencia` LEFT JOIN `incidencias` agrupado por estado (incluye estados con 0). `porTecnico()`: `SELECT` sobre `vw_resumen_por_tecnico` (reutiliza la vista existente, que ya usa `fn_incidencias_activas_tecnico`). |
| `src/controllers/reportes.controller.js` | Nuevo | `porEstado` y `porTecnico` (delegación + try/catch). |
| `src/routes/reportes.routes.js` | Nuevo | `GET /estados` y `GET /tecnicos`, ambas protegidas con `authenticate`. |
| `src/app.js` | Actualizado | Monta el router `/api/reportes`. |

**Notas técnicas**:
- `porTecnico` reutiliza `vw_resumen_por_tecnico` tal cual (AGENTS.md §22.2), sin duplicar la lógica en JavaScript.
- `porEstado` no tiene vista previa, así que agrupa directamente sobre las tablas base con LEFT JOIN para que aparezcan los 4 estados aunque tengan 0 incidencias.
- Ambos endpoints requieren autenticación (cualquier usuario logueado).

**Verificación**: `scripts/test-fase5.mjs` → **10/10 PASS** (los 4 estados presentes y ordenados, totales numéricos; técnicos con todos los campos del resumen; coherencia `total >= activas + resueltas`; 401 sin token; suma por estado == `COUNT(*)` de incidenas).

---

### Fase 6 — Postman ✅

**Objetivo**: colección de pruebas organizada en `postman/` cubriendo los 6 casos exigidos por AGENTS.md §31 (éxito, inválidos, no autenticado, sin permisos, inexistente, regla de negocio).

| Archivo | Acción | Detalle |
|---|---|---|
| `postman/Campus-Fix.postman_environment.json` | Nuevo | Variables: `base_url`, `admin_token`, `tecnico_token`, `usuario_token`, `incidencia_id`, `tecnico_id`. |
| `postman/Campus-Fix.postman_collection.json` | Nuevo | Colección v2.1 con 3 carpetas (Autenticación, Incidencias, Reportes) y **24 requests**. Los logins capturan tokens; el registro de incidencia captura `incidencia_id`. Cada request tiene un test `pm.test` que verifica el status esperado. |

**Cobertura por endpoint**:
- **Auth**: login admin/técnico/usuario (éxito), login contraseña incorrecta (inválido→401), me autenticado (éxito), me sin token (no autenticado→401).
- **Incidencias**: registrar (éxito/201), registrar sin título (inválido→400), listar (éxito), detalle (éxito), detalle inexistente (→404), detalle sin token (→401), asignar admin (éxito), asignar usuario (sin permisos→403), cambiar estado En proceso (éxito), Resuelta sin diagnóstico (RN-05→400), diagnóstico técnico (éxito/201), diagnóstico usuario (sin permisos→403), Resuelta con diagnóstico (éxito), evidencia técnico (éxito/201), evidencia tipo inválido (→400).
- **Reportes**: por estado (éxito), por técnico (éxito), por estado sin token (→401).

**Verificación**: ambos archivos JSON validados (parseo correcto; 24 requests, 6 variables de entorno). La colección es ejecutable en Postman/Newman tras importar el environment y arrancar el backend.

---

### Fase 7 — Frontend: integración con API ✅

**Objetivo**: conectar el prototipo de React con la API real del backend (hasta ahora usaba mock data y un modelo de dominio distinto).

| Archivo | Acción | Detalle |
|---|---|---|
| `frontend/src/types.ts` | Nuevo | Tipos de la API (`ApiUsuario`, `ApiIncidenciaList`, `ApiIncidenciaDetalle`, `ApiDiagnostico`, `ApiEvidencia`, `ApiHistorial`) + tipos de UI (`UiUser`, `UiIncident`, `UiStatus`, etc.). Mapeo: `mapRol`, `mapEstadoAUi` (sobrecargada `ApiEstado→UiStatus` y `UiStatus→ApiEstado`), `toUiUser`, `toUiIncidentList`, `toUiIncidentDetalle`. |
| `frontend/src/lib/auth.ts` | Nuevo | JWT en `localStorage` (`getToken`/`setToken`/`clearToken`). |
| `frontend/src/lib/api.ts` | Nuevo | Cliente `fetch` con base `import.meta.env.VITE_API_URL` (fallback `http://localhost:3000`), `Authorization: Bearer`, `ApiError`, y métodos `login`, `me`, `listarIncidencias`, `detalleIncidencia`, `registrarIncidencia`, `asignarTecnico`, `cambiarEstado`, `registrarDiagnostico`, `reportesTecnicos`. |
| `frontend/.env` | Nuevo | `VITE_API_URL=http://localhost:3000`. |
| `frontend/src/App.tsx` | Reescrito | Login real (`api.login` + guard de sesión con `/me` al montar), lista desde API (filtrado por rol en cliente), detalle integrado (MySQL + Mongo), registro real, y gestión (admin: asignar + estado; técnico: diagnóstico + estado). Se conservan los componentes visuales. |

**Mapeo de modelo (frontend ↔ backend)**:
- **Roles**: `Usuario`→`estudiante`, `Tecnico`→`tecnico`, `Administrador`→`administrador`.
- **Estados**: `Registrada`/`Asignada`→`Abierta`; `En proceso`→`En progreso`; `Resuelta`→`Resuelta`. Al enviar: `Abierta`/`Cerrada`→`Registrada`, `En progreso`→`En proceso`, `Resuelta`→`Resuelta`.
- **Incidencia**: `codigo`→`id` (visual), `id_incidencia` se conserva para llamadas API; `reportante`→`reportedBy`, `ubicacion`→`location`, `activo`→`equipment`, `tecnico`→`assignedTo`; diagnóstico más reciente→`diagnosis`/`resolution`; `historial`→timeline.
- El listado filtra en cliente: estudiante ve `reportante == su nombre`; técnico ve `tecnico == su nombre`; admin ve todas.

**Notas técnicas**:
- El backend tiene CORS habilitado, así el frontend (`:8443`) llama directo a `:3000`.
- La asignación en el panel admin usa la lista real de técnicos de `GET /api/reportes/tecnicos` (ids 3, 4, 5).
- RN-05 (Resuelta requiere diagnóstico) se valida en el backend; el frontend solo envía el estado.

**Verificación**: `tsc --noEmit` sin errores; `vite build` exitoso. Los endpoints invocados fueron probados de extremo a extremo en Fases 4 y 5.

---

### Fase 8 — Frontend: refactor estructural ✅

**Objetivo**: dividir el monolito `App.tsx` (~950 líneas) en una estructura por carpetas (`pages/`, `components/`, `hooks/`, `lib/`), incorporar **React Router**, y eliminar los restos de Figma Make.

| Archivo | Acción | Detalle |
|---|---|---|
| `frontend/src/App.tsx` | Reescrito | Solo define `<BrowserRouter>` + `<Routes>`: `/login`, `/incidencias`, `/incidencias/nueva` (solo `estudiante`), `/incidencias/:id`, `/incidencias/:id/gestionar` (solo `admin`/`tecnico`), y `*` → `/incidencias`. |
| `frontend/src/main.tsx` | Actualizado | Envuelve `<App/>` en `<AuthProvider>`. |
| `frontend/src/components/auth/AuthProvider.tsx` | Nuevo | Contexto de autenticación: `user`, `loading`, `login(correo, contrasena)`, `logout()`. Verifica token al montar vía `GET /api/auth/me`. |
| `frontend/src/components/auth/RequireRole.tsx` | Nuevo | Guard de ruta por rol (`roles: UiRol \| UiRol[]`); redirige a `/login` o `/incidencias` si no aplica. |
| `frontend/src/hooks/useAuth.ts` | Nuevo | Re-exporta `useAuth` del provider. |
| `frontend/src/hooks/useIncidents.ts` | Nuevo | Carga la lista (`GET /api/incidencias`) con `reload()`. |
| `frontend/src/hooks/useIncident.ts` | Nuevo | Carga el detalle por `id` (`GET /api/incidencias/:id`) con `reload()`. |
| `frontend/src/components/layout/Sidebar.tsx` | Nuevo | Menú lateral con `NavLink` (roles visibles según usuario) y botón de logout. |
| `frontend/src/components/layout/TopBar.tsx` | Nuevo | Barra superior presentacional (título/subtítulo/acciones). |
| `frontend/src/components/layout/Shell.tsx` | Nuevo | Compone `TopBar` + `<main>` scrollable; lo usan las páginas. |
| `frontend/src/components/layout/AppLayout.tsx` | Nuevo | Layout route: guard de auth + `<Outlet/>` (Sidebar fijo + contenido). |
| `frontend/src/components/ui/Badges.tsx` | Nuevo | `statusColor` + `StatusBadge` + `PriorityBadge` + `RoleBadge` (extraídos de `App.tsx`). |
| `frontend/src/pages/LoginPage.tsx` | Nuevo | Login real con acceso rápido demo; redirige a `/incidencias`. |
| `frontend/src/pages/IncidentsListPage.tsx` | Nuevo | Lista con stats, búsqueda y filtro por estado; navega al detalle. |
| `frontend/src/pages/IncidentDetailPage.tsx` | Nuevo | Detalle integrado (MySQL + Mongo) con botón "Gestionar" según `canManage`. |
| `frontend/src/pages/RegisterIncidentPage.tsx` | Nuevo | Registro de incidencia (solo estudiante). |
| `frontend/src/pages/ManageIncidentPage.tsx` | Nuevo | Admin: asignar técnico + cambiar estado. Técnico: diagnóstico + estado. |
| `frontend/src/types.ts` | Actualizado | Agrega tipos `Category` y `Technician` (antes locales en `App.tsx`). |
| `frontend/vite.config.ts` | Limpieza | Se eliminan los plugins de Figma (`figmaSiteConfiguration`, `figmaErrorOverlayReplay`, `figmaReactRefreshBoundaryFallback`, `figmaMakeKitPlugin`) y el import de `./.figma/make/site.json`. Queda solo `react()` + `tailwindcss()` + alias `@`. |
| `frontend/index.html` | Limpieza | Se eliminan los comment-slots `<!-- figma:* -->`; HTML estándar con `<title>` y lang `es`. |
| `frontend/.figma/` | Eliminado | Directorio de Figma Make borrado. |
| `frontend/package.json` | Limpieza | Se quita el script `format` (usaba `oxfmt`). |

**Notas técnicas**:
- Se agregó la dependencia `react-router-dom@^6` al frontend.
- La navegación ya no usa estado `page` + `onNav`; ahora es declarativa con React Router (`useNavigate`, `useParams`, `NavLink`, `Navigate`, `Outlet`).
- El estado de sesión vive en `AuthProvider` (contexto), de modo que cualquier página/hook accede con `useAuth()`.
- Cada página carga sus propios datos vía hooks (`useIncidents`/`useIncident`), en lugar de propagarlos desde un único estado en `App`.
- El diseño (estilos inline) se conservó intacto para no alterar la experiencia que ya funciona; Tailwind v4 sigue disponible en `index.css`.

**Verificación**: `tsc --noEmit` sin errores; `vite build` exitoso (37 módulos); `pnpm --filter frontend dev` arranca sin warnings y sirve 200 en `:8443`.

---

### Fase 9 — Endurecimiento y QA final ✅

**Objetivo**: verificar de extremo a extremo todas las reglas de negocio (RN-01..RN-08) y los criterios de aceptación de `AGENTS.md` §35, revisar seguridad, y llevar los datos de prueba a los mínimos de `AGENTS.md` §30.

| Archivo | Acción | Detalle |
|---|---|---|
| `backend/scripts/test-fase9.mjs` | Nuevo | QA integral automatizado contra el backend vivo: autenticación (login admin/técnico/usuario, contraseña incorrecta→401, `/me` sin token→401, rol en `/me`), registro de incidencia (201, código `INC-AAAA-NNNN` → RN-02, estado inicial `Registrada` → RN-03, detalle integrado con `historial`/`diagnosticos`/`evidencias` arrays), listado/detalle, asignación (usuario→403, no-técnico→400/409, admin→200 + estado `Asignada`), cambio de estado (RN-04 `En proceso` con técnico→200, RN-06 historial conserva cambios, RN-05 `Resuelta` sin diagnóstico→400, diagnóstico Mongo→201, `Resuelta` con diagnóstico→200), evidencias (201, tipo inválido→400), reportes (4 estados + suma coherente con `COUNT(*)`, `vw_resumen_por_tecnico` con todos sus campos), errores uniformes (404/400 con `{success:false,message}`), RN-07 (DELETE de `Resuelta` bloqueado por trigger + no hay endpoint de borrado→404), y `verificarMinimos()` con conteos SQL/Mongo. Incluye `AbortController` (timeout 10s) y limpieza de la incidencia de prueba (resetea estado y borra MySQL + Mongo). |
| `backend/scripts/seed-complementarios.mjs` | Nuevo | Ampliación de datos de prueba (autorizada por el usuario). Inserta **solo el déficit** para cumplir §30 sin tocar `datos.sql`: usa el pool + `bcryptjs` (contraseñas hasheadas), crea usuarios/activos/incidencias (el trigger genera el código y el estado inicial `Registrada`), y asignaciones coherentes (`INSERT` en `asignaciones` + `UPDATE` de estado a `Asignada` con las variables de sesión `@campusfix_*` para que el trigger registre historial). Idempotente por déficit. |

**Verificación de datos (mínimos `AGENTS.md` §30, conteo final)**:
| Dato | Mínimo | Obtenido |
|---|---|---|
| roles | 3 | 3 |
| usuarios | 10 | 10 |
| técnicos | 3 | 4 |
| ubicaciones | 5 | 8 |
| activos | 15 | 15 |
| incidencias | 30 | 31 |
| asignaciones | 20 | 21 |
| historial | 40 | 49 |
| diagnósticos Mongo | 20 | 40 |
| evidencias Mongo | 20 | 40 |

**Resultado QA**: `scripts/test-fase9.mjs` → **47/47 PASS** (43 comprobaciones de RN/seguridad + 4 de datos).

**Revisión de seguridad (criterios `AGENTS.md` §23/§35)**:
- Contraseñas hasheadas con bcrypt (coste 10), nunca en texto plano; login solo con `activo = TRUE` (RN-01).
- JWT firmado con secreto en variable de entorno; middleware `authenticate` + `authorize(rol)`.
- Consultas 100% parametrizadas; el reportante se toma del token.
- Respuestas de error uniformes `{ success: false, message }`; sin stack traces ni secretos expuestos.
- RN-02 (código único), RN-03 (estado inicial), RN-04 (técnico para `En proceso`), RN-05 (diagnóstico para `Resuelta`), RN-06 (historial por trigger), RN-07 (no borrar `Resuelta`), RN-08 (transacciones en SP) — todas verificadas automáticamente.

**Notas**:
- El seed no modifica los scripts existentes (respeta `AGENTS.md` restricción #19); crea un script nuevo y aditivo.
- Todos los endpoints críticos fueron validados también en las Fases 4, 5 y 7.

---

## 5. Estado del plan

**Todas las fases (0 a 9) están completas y verificadas.** No quedan fases pendientes.

---

## 6. Cómo ejecutar el proyecto

```bash
# 1) Instalar dependencias (desde el root)
pnpm install

# 2) Backend (desde el root o backend/)
pnpm --filter backend dev      # arranca nodemon en http://localhost:3000

# 3) Frontend (desde el root o frontend/)
pnpm --filter frontend dev     # Vite (usa PORT del entorno o 5173)

# 4) Regenerar contraseñas de usuarios (una vez o cuando se requiera)
pnpm --filter backend exec node scripts/setup-passwords.js
```

> Nota: `backend/.env` debe contener las credenciales reales de conexión. Copia
> `backend/.env.example` → `backend/.env` y completa los valores.

## 7. Credenciales de desarrollo

Todos los usuarios usan la misma contraseña por defecto (definida en `.env` como
`DEFAULT_PASSWORD`). Usuarios disponibles:

| Rol | Correo |
|---|---|
| Administrador | `carlos.mendoza@ecotec.edu.ec`, `maria.gonzalez@ecotec.edu.ec` |
| Técnico | `andres.vera@ecotec.edu.ec`, `daniel.torres@ecotec.edu.ec`, `luis.paredes@ecotec.edu.ec` |
| Usuario | `juan.perez@ecotec.edu.ec`, `ana.rodriguez@ecotec.edu.ec`, `pedro.sanchez@ecotec.edu.ec` |

## 8. Reglas de negocio (RN) implementadas / pendientes

| RN | Regla | Estado |
|---|---|---|
| RN-01 | Solo usuarios `activo = TRUE` inician sesión | ✅ Implementada |
| RN-02 | Código único de incidencia (SP + trigger) | ✅ Implementada |
| RN-03 | Nueva incidencia inicia en `Registrada` | ✅ Implementada |
| RN-04 | `En proceso` requiere técnico asignado (SP + backend) | ✅ Implementada |
| RN-05 | `Resuelta` requiere diagnóstico en MongoDB (backend) | ✅ Implementada |
| RN-06 | Historial automático vía trigger | ✅ (vía BD) |
| RN-07 | No eliminar físicamente incidencias resueltas (trigger) | ✅ (vía BD) |
| RN-08 | Transacciones en SP de asignación/cambio de estado | ✅ (vía BD) |

## 9. Decisiones técnicas importantes

- **ESM en backend**: `"type": "module"` para consistencia con el frontend.
- **bcryptjs en lugar de bcrypt**: `.npmrc` global tiene `ignore-scripts=true`, lo que impediría la compilación nativa de `bcrypt`.
- **El SP `sp_registrar_incidencia` exige código no vacío**: el trigger solo auto-genera en INSERT directo, por lo que el backend genera el código `INC-AAAA-XXXX` replicando el patrón.
- **El reportante se toma del token**, nunca del body, para evitar suplantación.
- **Errores de SP** (`SIGNAL '45000'`) se mapean a HTTP 400; duplicados (`ER_DUP_ENTRY`) a 409.
- **`.env` con credenciales reales NO se commitea**; `.env.example` solo placeholders.
- **`fn_dias_transcurridos`, vistas y SP se reutilizan** en lugar de duplicar lógica en JavaScript.

## 10. Seguridad y buenas prácticas

- Consultas siempre parametrizadas (nunca concatenación de variables).
- Contraseñas hasheadas con bcrypt (coste 10), nunca texto plano.
- JWT con expiración (`JWT_EXPIRES_IN`).
- Middleware de autenticación y autorización por rol.
- Respuestas de error uniformes `{ success: false, message }`; sin stack traces en producción.
- No se exponen `contrasena_hash`, secretos ni credenciales.