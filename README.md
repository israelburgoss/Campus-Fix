# Campus-Fix

> Plataforma de gestión de **incidencias tecnológicas** para un campus universitario.

## ¿De qué trata el proyecto?

Campus-Fix es una aplicación web full-stack para gestionar el ciclo de vida de las
**incidencias tecnológicas** dentro de un campus universitario (fallas de proyectores,
equipos de laboratorio, redes, mobiliario técnico, etc.).

El sistema diferencia tres roles con responsabilidades claras:

- **Usuario / Estudiante** — reporta incidencias describiendo el problema y el activo afectado.
- **Técnico** — recibe las incidencias que le asignan, las diagnostica, registra la
  evidencia y las lleva al estado `Resuelta`.
- **Administrador** — asigna incidencias a técnicos, da seguimiento y consulta reportes.

Cada incidencia avanza por un flujo estricto de estados
(`Registrada → Asignada → En proceso → Resuelta`), y la información relacional vive en
**MySQL** mientras que los documentos de diagnóstico y evidencia viven en **MongoDB**,
integrados por ID. El backend es una API REST (Node.js + Express) con autenticación
**JWT** por rol; el frontend es una SPA en **React + TypeScript + Vite**.

## ¿Qué problema resuelve?

En un campus universitario, las fallas de equipos suelen reportarse por canales
informales (correos, grupos de mensajería, planillas sueltas), lo que genera:

- **Falta de trazabilidad** — no se sabe quién reportó, quién atiende ni cuándo se resolvió.
- **Pérdida de conocimiento** — los diagnósticos y soluciones no quedan documentados.
- **Asignación ineficiente** — los administradores no tienen visibilidad de la carga de
  trabajo de cada técnico.
- **Sin métricas** — es imposible saber cuántas incidencias hay por estado o por técnico.

Campus-Fix centraliza todo en una sola plataforma: registro estructurado, asignación por
rol, historial automático de cada cambio, diagnóstico/evidencia documental y reportes en
tiempo real. Así se reduce el tiempo de atención, se conserva el conocimiento técnico y
se obtienen métricas de gestión.

---

## 📚 Índice

- [¿De qué trata el proyecto?](#de-qué-trata-el-proyecto)
- [¿Qué problema resuelve?](#qué-problema-resuelve)
- [Características](#características)
- [Arquitectura y stack](#arquitectura-y-stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Bases de datos](#bases-de-datos)
- [Requisitos previos](#requisitos-previos)
- [Manual de instalación](#manual-de-instalación)
- [Poblamiento de datos](#poblamiento-de-datos)
- [Manual de ejecución](#manual-de-ejecución)
- [API REST](#api-rest)
- [Reglas de negocio](#reglas-de-negocio)
- [Seguridad](#seguridad)
- [Pruebas y QA](#pruebas-y-qa)
- [Colección Postman](#colección-postman)
- [Frontend](#frontend)
- [Variables de entorno](#variables-de-entorno)
- [Credenciales de desarrollo](#credenciales-de-desarrollo)
- [Documentación adicional](#documentación-adicional)

---

## Características

- **Ciclo de vida de incidencias** con flujo estricto de estados:
  `Registrada → Asignada → En proceso → Resuelta`.
- **Roles** con permisos diferenciados: `Administrador`, `Técnico`, `Usuario`.
- **Asignación** de incidencias a técnicos (solo administradores).
- **Diagnóstico y evidencia** almacenados en MongoDB, vinculados por `incidenciaId`.
- **Reglas de negocio** garantizadas en la base de datos (procedimientos almacenados,
  triggers y vistas) y reutilizadas por el backend.
- **Reportes** de incidencias por estado y por técnico.
- **Autenticación JWT**, contraseñas hasheadas con bcrypt, y autorización por rol.
- **Frontend** con login, listado filtrado por rol, detalle integrado MySQL+Mongo,
  registro de incidencias y panel de gestión.

---

## Arquitectura y stack

| Capa | Tecnología |
|------|------------|
| Backend | Node.js (ESM), Express 5, JavaScript |
| Base de datos relacional | MySQL (driver `mysql2`, conexión por *pool*) |
| Base de datos documental | MongoDB (driver `mongodb`) |
| Autenticación | `jsonwebtoken` (JWT) + `bcryptjs` |
| Validación | `zod` |
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 |
| Gestor de paquetes | `pnpm` (monorepo con `pnpm-workspace.yaml`) |

**Capas del backend** (patrón controlador → servicio → base de datos):

```
routes/        → definen rutas HTTP y protección (auth/rol)
controllers/   → leen parámetros/body, invocan servicios, arman respuestas
services/      → lógica de negocio, SPs, consultas y coordinación MySQL+Mongo
config/        → conexiones MySQL, MongoDB y carga de variables de entorno
middleware/    → autenticación (JWT), autorización por rol, errores globales
```

---

## Estructura del repositorio

```
Campus-Fix/
├── backend/
│   └── src/
│       ├── app.js                 # arranque Express, montaje de rutas, errores globales
│       ├── config/                # mysql.js, mongodb.js, env.js
│       ├── controllers/           # auth, incidencias, reportes
│       ├── middleware/            # auth, role, error
│       ├── routes/                # auth, incidencias, reportes
│       └── services/              # auth, incidencias, reportes
│       └── scripts/               # setup-passwords, seed-complementarios, test-*
├── database/
│   ├── mysql/                     # schema.sql, datos.sql, programacion.sql, pruebas.sql
│   └── mongodb/                   # colecciones.js, pruebas.js
├── docs/
│   └── PROGRESO.md                # bitácora técnica por fases
├── frontend/
│   └── src/
│       ├── App.tsx, main.tsx
│       ├── pages/                 # Login, IncidentsList, IncidentDetail, Register, Manage
│       ├── components/            # auth/, layout/, ui/
│       ├── hooks/                 # useAuth, useIncidents, useIncident
│       ├── lib/                   # api.ts, auth.ts
│       └── types.ts
├── postman/                       # colección + environment de pruebas
├── package.json                   # raíz (workspace)
├── pnpm-workspace.yaml
└── README.md
```

---

## Bases de datos

La **fuente de verdad** es el contenido de `database/`. El backend se adapta a esa
estructura; no la reinventa.

### MySQL (`database/mysql/`)

- **`schema.sql`** — tablas: `roles`, `usuarios`, `ubicaciones`, `activos`,
  `estados_incidencia`, `incidencias`, `asignaciones`, `historial_estados`.
- **`programacion.sql`** — lógica de negocio reutilizada por el backend:
  - Procedimientos: `sp_registrar_incidencia`, `sp_asignar_tecnico`, `sp_cambiar_estado`.
  - Funciones: `fn_dias_transcurridos`, `fn_incidencias_activas_tecnico`.
  - Triggers: `trg_incidencias_validar_codigo` (genera `INC-AAAA-NNNN` si no hay
    código y evita duplicados), `trg_incidencias_historial_estado` (registra el
    historial automáticamente usando `@campusfix_usuario_cambio` / `@campusfix_comentario`),
    `trg_incidencias_prevenir_delete_resuelta` (bloquea borrar incidencias `Resuelta`).
  - Vistas: `vw_incidencias_activas`, `vw_resumen_por_tecnico`.
- **`datos.sql`** — datos semilla base.
- **`pruebas.sql`** — datos de prueba adicionales.

### MongoDB (`database/mongodb/`)

Base de datos `campusfix` con dos colecciones (validadas con `$jsonSchema`):

- **`diagnosticos`** — `incidenciaId`, `tecnicoId`, `descripcion`, `fecha`,
  `pruebasRealizadas`, `causaProbable`, `solucionAplicada`. Índice por `incidenciaId`.
- **`evidencias`** — `incidenciaId`, `tipo` (imagen/documento/video), `url`, `fecha`,
  `nombre`, `descripcion`. Índice por `incidenciaId`.

La relación entre ambas BD es por ID: `incidencias.id_incidencia` ↔
`diagnosticos.incidenciaId` / `evidencias.incidenciaId`, y
`usuarios.id_usuario` ↔ `diagnosticos.tecnicoId`.

---

## Requisitos previos

- **Node.js** 18+ (probado en v24)
- **pnpm** 9+ (el proyecto usa `pnpm-workspace.yaml`)
- Servidor **MySQL** 8+ accesible
- Servidor **MongoDB** 6+ accesible
- Las bases de datos deben existir y estar pobladas con los scripts de `database/`
  (ver [Poblamiento de datos](#poblamiento-de-datos))

---

## Manual de instalación

Sigue estos pasos en orden para dejar el proyecto instalado y configurado:

### 1) Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO> Campus-Fix
cd Campus-Fix
```

### 2) Instalar dependencias

El proyecto es un monorepo gestionado con `pnpm` (ver `pnpm-workspace.yaml`):

```bash
pnpm install
```

### 3) Configurar el backend

Copia el archivo de entorno de ejemplo y completa los valores reales:

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` con tus credenciales de base de datos, JWT y contraseña por
defecto (ver [Variables de entorno](#variables-de-entorno)). **Nunca commitees
`backend/.env`.**

> El backend carga `backend/.env` automáticamente mediante `dotenv` al iniciar.

---

## Poblamiento de datos

1. **MySQL**: ejecuta los scripts en orden (usando tu cliente MySQL):

   ```bash
   mysql -u <usuario> -p campusfix < database/mysql/schema.sql
   mysql -u <usuario> -p campusfix < database/mysql/programacion.sql
   mysql -u <usuario> -p campusfix < database/mysql/datos.sql
   mysql -u <usuario> -p campusfix < database/mysql/pruebas.sql
   ```

2. **MongoDB**: carga las colecciones y datos de prueba:

   ```bash
   mongosh campusfix database/mongodb/colecciones.js
   mongosh campusfix database/mongodb/pruebas.js
   ```

3. **Contraseñas**: los hashes de `datos.sql` pueden no coincidir con tu entorno.
   Regenera los hashes de todas las contraseñas con el script del backend:

   ```bash
   pnpm --filter backend exec node scripts/setup-passwords.js
   ```

   Todas las contraseñas quedarán en la definida por `DEFAULT_PASSWORD` en `.env`.

4. **Datos complementarios (opcional)**: si necesitas cumplir los volúmenes mínimos de
   prueba (`AGENTS.md` §30: ≥10 usuarios, ≥15 activos, ≥30 incidencias, ≥20
   asignaciones, etc.), ejecuta el seed aditivo (no modifica los scripts existentes):

   ```bash
   pnpm --filter backend exec node scripts/seed-complementarios.mjs
   ```

---

## Ejecución

En terminales separadas (o con tu gestor de procesos favorito):

```bash
# Backend (Express en http://localhost:3000)
pnpm --filter backend dev      # nodemon (recarga en caliente)
# o bien: pnpm --filter backend start

# Frontend (Vite)
pnpm --filter frontend dev     # abre la URL que indique Vite
```

> El backend expone CORS, por lo que el frontend puede consumirlo directamente desde
> otro puerto. La URL de la API se configura en el frontend con la variable
> `VITE_API_URL` (ver `frontend/.env`, por defecto `http://localhost:3000`).

---

## API REST

Base: `http://localhost:3000/api`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | — | Iniciar sesión (correo + contraseña) → JWT |
| GET | `/auth/me` | ✅ | Devuelve el usuario autenticado y su rol |
| POST | `/incidencias` | ✅ | Registrar incidencia (estado inicial `Registrada`) |
| GET | `/incidencias` | ✅ | Listar incidencias (filtros: estado, prioridad, técnico) |
| GET | `/incidencias/:id` | ✅ | Detalle integrado (MySQL + Mongo + historial) |
| PUT | `/incidencias/:id/asignar` | ✅ Admin | Asignar un técnico (`sp_asignar_tecnico`) |
| PUT | `/incidencias/:id/estado` | ✅ | Cambiar estado (`sp_cambiar_estado`) |
| POST | `/incidencias/:id/diagnosticos` | ✅ Técnico asignado | Registrar diagnóstico en MongoDB |
| POST | `/incidencias/:id/evidencias` | ✅ Técnico/Admin | Registrar evidencia en MongoDB |
| GET | `/reportes/estados` | ✅ | Incidencias agrupadas por estado |
| GET | `/reportes/tecnicos` | ✅ | Resumen por técnico (usa `vw_resumen_por_tecnico`) |
| GET | `/health` | — | Estado de conexión MySQL + MongoDB |

**Respuestas de error uniformes**:

```json
{ "success": false, "message": "Descripción del error" }
```

Códigos HTTP: `200/201` éxito · `400` validación · `401` no autenticado ·
`403` sin permisos · `404` no encontrado · `409` conflicto (p.ej. código duplicado) ·
`422` datos inválidos · `500` error interno.

---

## Reglas de negocio

| RN | Regla | Garantizada por |
|----|-------|-----------------|
| RN-01 | Solo usuarios `activo = TRUE` inician sesión | Backend (login) |
| RN-02 | Código único de incidencia (`INC-AAAA-NNNN`) | Trigger + SP |
| RN-03 | Toda incidencia inicia en `Registrada` | `sp_registrar_incidencia` |
| RN-04 | `En proceso` requiere técnico asignado | SP + backend (403 si no) |
| RN-05 | `Resuelta` requiere diagnóstico en MongoDB | Backend (valida antes del SP) |
| RN-06 | Todo cambio de estado queda en `historial_estados` | Trigger `trg_incidencias_historial_estado` |
| RN-07 | No se puede borrar físicamente una `Resuelta` | Trigger `trg_incidencias_prevenir_delete_resuelta` |
| RN-08 | Operaciones multi-tabla usan transacciones | SPs `sp_asignar_tecnico` / `sp_cambiar_estado` |

---

## Seguridad

- **Contraseñas** hasheadas con `bcryptjs` (coste 10), nunca en texto plano.
- **JWT** firmado con `JWT_SECRET` (variable de entorno) y con expiración.
- **Autenticación** mediante middleware `authenticate` (valida el Bearer token).
- **Autorización por rol** con `authorize('Administrador')` donde aplica.
- **Consultas 100% parametrizadas** (`?`); nunca concatenación de strings.
- **El reportante se toma del token**, no del body (evita suplantación).
- **Errores** sin stack traces ni secretos expuestos; formato uniforme.
- **`.env` con credenciales no se commitea**; se usa `.env.example` como plantilla.

---

## Pruebas y QA

Existen scripts de verificación automatizados en `backend/scripts/`:

| Script | Qué valida |
|--------|------------|
| `test-fase4.mjs` | Ciclo de vida de incidencia (registro → asignación → estado → diagnóstico → evidencia) |
| `test-fase5.mjs` | Reportes por estado y por técnico |
| `test-fase9.mjs` | **QA integral**: RN-01…RN-08, seguridad, uniformidad de errores y mínimos de datos |

Ejemplo:

```bash
# Asegúrate de que el backend esté corriendo en :3000
pnpm --filter backend exec node scripts/test-fase9.mjs
```

El QA de Fase 9 valida **47 comprobaciones** (43 de reglas de negocio/seguridad + 4 de
volúmenes de datos) y limpia la incidencia de prueba al finalizar.

---

## Colección Postman

`postman/Campus-Fix.postman_collection.json` + `postman/Campus-Fix.postman_environment.json`
contienen **24 requests** organizados en Autenticación, Incidencias y Reportes, cubriendo
los 6 casos exigidos (éxito, inválidos, no autenticado, sin permisos, inexistente y
regla de negocio). Importa primero el *environment* y luego la colección; arranca el
backend antes de ejecutar.

---

## Frontend

SPA en React 19 + TypeScript con **React Router**:

- `/login` — autenticación (con acceso rápido a usuarios demo).
- `/incidencias` — listado con estadísticas, búsqueda y filtros; visible según rol.
- `/incidencias/nueva` — registro (solo `Usuario`/estudiante).
- `/incidencias/:id` — detalle integrado (MySQL + Mongo).
- `/incidencias/:id/gestionar` — panel de gestión (Admin: asignar + estado;
  Técnico: diagnóstico + estado).

Estado de sesión en `AuthProvider` (contexto). Cada página carga sus datos vía hooks
(`useIncidents`, `useIncident`). El mapeo de estados/roles del backend al modelo de UI
se centraliza en `frontend/src/types.ts`.

Variables de entorno del frontend:

```bash
# frontend/.env
VITE_API_URL=http://localhost:3000
```

---

## Variables de entorno

`backend/.env` (plantilla en `backend/.env.example`):

```env
PORT=3000

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=campusfix
MYSQL_USER=usuario_bd
MYSQL_PASSWORD=

MONGODB_URI=mongodb://usuario_bd:password_bd@localhost:27017/campusfix?authSource=campusfix

JWT_SECRET=cambia_este_secreto_en_produccion
JWT_EXPIRES_IN=8h

DEFAULT_PASSWORD=cambia_la_contrasena_por_defecto
```

> En producción: usa un `JWT_SECRET` fuerte y único, y cambia `DEFAULT_PASSWORD`.

---

## Credenciales de desarrollo

Todos los usuarios comparten la contraseña definida en `DEFAULT_PASSWORD` (tras ejecutar
`setup-passwords.js`):

| Rol | Correo |
|-----|--------|
| Administrador | `carlos.mendoza@ecotec.edu.ec`, `maria.gonzalez@ecotec.edu.ec` |
| Técnico | `andres.vera@ecotec.edu.ec`, `daniel.torres@ecotec.edu.ec`, `luis.paredes@ecotec.edu.ec` |
| Usuario | `juan.perez@ecotec.edu.ec`, `ana.rodriguez@ecotec.edu.ec`, `pedro.sanchez@ecotec.edu.ec` |

---

## Documentación adicional

- **`docs/PROGRESO.md`** — bitácora técnica completa por fases (0 a 9): decisiones,
  archivos modificados, verificaciones y estado del plan. Útil para nuevos
  desarrolladores que se integren al proyecto.

---

## Notas y limitaciones

- El backend se adhiere estrictamente a la estructura de `database/` (no la modifica
  para facilitar el desarrollo).
- No se implementaron recuperación de contraseña, verificación por correo ni 2FA
  (fuera de alcance según especificación).
- La carga física de archivos no es obligatoria; la evidencia se registra como metadatos
  (URL/ruta) en MongoDB.
