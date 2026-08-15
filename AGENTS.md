# Campus-Fix --- Especificación para desarrollo del backend

## 1. Propósito

Este documento es la especificación técnica que debe utilizar una IA
para desarrollar el backend del proyecto **Campus-Fix**.

El objetivo es construir una API REST con **Node.js + Express.js** que
integre:

-   MySQL como base de datos relacional principal.
-   MongoDB para diagnósticos y evidencias.
-   JWT para autenticación.
-   Una arquitectura sencilla basada en `config`, `controllers`,
    `middleware`, `routes` y `services`.

### Regla fundamental

La IA debe trabajar **sobre lo que ya existe en el proyecto**.

Los scripts actuales de MySQL y MongoDB son la **fuente de verdad de la
estructura de datos**. La IA no debe inventar nombres de tablas,
columnas, relaciones, procedimientos, funciones, triggers, vistas o
colecciones.

Si este documento y los scripts existentes presentan una diferencia
respecto de la estructura de datos, primero se debe revisar el script y
adaptar el backend a la estructura existente. No se debe modificar la
base de datos únicamente para facilitar el desarrollo del backend, salvo
autorización explícita.

------------------------------------------------------------------------

# 2. Contexto del repositorio

La estructura actual del proyecto es:

``` text
Campus-Fix/
├── backend/
│   └── src/
│       ├── app.js
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── services/
├── backups/
├── database/
│   ├── mongodb/
│   │   ├── colecciones.js
│   │   └── pruebas.js
│   └── mysql/
│       ├── datos.sql
│       ├── programacion.sql
│       ├── pruebas.sql
│       └── schema.sql
├── docs/
├── frontend/
├── postman/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

Actualmente, las carpetas internas de `backend/src` están preparadas
para la arquitectura, pero no contienen todavía la implementación
completa.

No se debe asumir que existen controllers, services, middlewares o rutas
ya implementados. Deben crearse según sea necesario.

------------------------------------------------------------------------

# 3. Tecnologías obligatorias

## Backend

-   Node.js
-   Express.js
-   JavaScript
-   pnpm

## Bases de datos Existente

-   MySQL
-   MongoDB

## Frontend existente

El frontend es independiente del backend y utiliza React + TypeScript +
Vite.

La IA no debe modificar el frontend cuando la tarea solicitada
corresponda exclusivamente al backend.

Trabajaras tambien el backend en base al las base de datos .

------------------------------------------------------------------------

# 4. Fuente de verdad de la base de datos

Antes de implementar una funcionalidad, la IA debe revisar los archivos
correspondientes.

## MySQL

``` text
database/mysql/schema.sql
database/mysql/datos.sql
database/mysql/programacion.sql
database/mysql/pruebas.sql
```

## MongoDB

``` text
database/mongodb/colecciones.js
database/mongodb/pruebas.js
```

La estructura MySQL existente define, entre otras, las entidades:

-   `roles`
-   `usuarios`
-   `ubicaciones`
-   `activos`
-   `estados_incidencia`
-   `incidencias`
-   `asignaciones`
-   `historial_estados`

El esquema existente utiliza relaciones entre estas entidades y
restricciones de integridad referencial.

------------------------------------------------------------------------

# 5. Modelo MySQL existente

## 5.1 Roles

Tabla:

``` text
roles
```

Campos existentes:

``` text
id_rol
nombre_rol
descripcion
```

`nombre_rol` es único.

Los roles requeridos por el proyecto son:

``` text
Administrador
Tecnico
Usuario
```

La IA debe utilizar exactamente los valores existentes en la base de
datos.

------------------------------------------------------------------------

## 5.2 Usuarios

Tabla:

``` text
usuarios
```

Campos:

``` text
id_usuario
id_rol
nombres
apellidos
correo
contrasena_hash
activo
fecha_registro
```

El correo es único.

La contraseña debe almacenarse en `contrasena_hash`, nunca en texto
plano.

El campo `activo` determina si el usuario puede iniciar sesión.

------------------------------------------------------------------------

## 5.3 Ubicaciones

Tabla:

``` text
ubicaciones
```

Campos:

``` text
id_ubicacion
nombre
tipo
edificio
```

------------------------------------------------------------------------

## 5.4 Activos

Tabla:

``` text
activos
```

Campos:

``` text
id_activo
id_ubicacion
nombre
tipo
codigo_inventario
estado_activo
```

Un activo pertenece a una ubicación.

Los estados definidos para un activo son:

``` text
Operativo
Fuera de servicio
```

------------------------------------------------------------------------

## 5.5 Estados de incidencia

Tabla:

``` text
estados_incidencia
```

Campos:

``` text
id_estado
nombre_estado
orden
```

Los estados funcionales requeridos son:

``` text
Registrada
Asignada
En proceso
Resuelta
```

El orden de los estados es:

``` text
1. Registrada
2. Asignada
3. En proceso
4. Resuelta
```

------------------------------------------------------------------------

## 5.6 Incidencias

Tabla:

``` text
incidencias
```

Campos existentes:

``` text
id_incidencia
codigo
titulo
descripcion
prioridad
id_activo
id_usuario_reporta
id_estado
fecha_registro
fecha_actualizacion
```

La prioridad permitida es:

``` text
Baja
Media
Alta
```

El técnico no se almacena directamente dentro de `incidencias`; la
relación se realiza mediante `asignaciones`.

------------------------------------------------------------------------

## 5.7 Asignaciones

Tabla:

``` text
asignaciones
```

Campos:

``` text
id_asignacion
id_incidencia
id_tecnico
asignado_por
fecha_asignacion
```

La tabla relaciona:

-   Una incidencia.
-   El técnico asignado.
-   El usuario que realiza la asignación.

------------------------------------------------------------------------

## 5.8 Historial

Tabla:

``` text
historial_estados
```

Campos:

``` text
id_historial
id_incidencia
id_estado
id_usuario_cambio
fecha_cambio
comentario
```

El historial no debe ser creado manualmente por cada endpoint si la
operación de cambio de estado ya utiliza la lógica SQL existente.

------------------------------------------------------------------------

# 6. Lógica MySQL existente

El archivo `database/mysql/programacion.sql` ya contiene lógica de
negocio mediante procedimientos, funciones, triggers y vistas.

La IA debe reutilizar esta lógica cuando corresponda.

## 6.1 Procedimientos almacenados

Existen:

``` text
sp_registrar_incidencia
sp_asignar_tecnico
sp_cambiar_estado
```

### `sp_registrar_incidencia`

Recibe:

``` text
p_codigo
p_titulo
p_descripcion
p_prioridad
p_id_activo
p_id_usuario_reporta
```

Valida campos obligatorios, prioridad, existencia y actividad del
usuario reportante y código único. También obtiene el estado
`Registrada` antes de insertar la incidencia.

El backend debe considerar este procedimiento como la lógica existente
para registrar incidencias.

### `sp_asignar_tecnico`

Recibe:

``` text
p_id_incidencia
p_id_tecnico
p_asignado_por
```

Valida:

-   Existencia de la incidencia.
-   Que no esté resuelta.
-   Que el técnico exista.
-   Que el técnico esté activo.
-   Que el usuario tenga rol `Tecnico`.
-   Que el usuario que realiza la asignación esté activo.
-   Que el usuario que realiza la asignación tenga rol `Administrador`.

Registra la asignación, cambia la incidencia a `Asignada` y trabaja
dentro de una transacción.

### `sp_cambiar_estado`

Recibe:

``` text
p_id_incidencia
p_id_estado_nuevo
p_id_usuario_cambio
p_comentario
```

Controla:

``` text
Registrada -> Asignada
Asignada -> En proceso
En proceso -> Resuelta
```

No permite modificar una incidencia que ya está `Resuelta`.

También verifica que exista un técnico asignado antes de pasar a
`En proceso`.

La validación del diagnóstico para pasar a `Resuelta` debe realizarla el
backend consultando MongoDB.

------------------------------------------------------------------------

# 7. Funciones MySQL existentes

El proyecto tiene:

``` text
fn_dias_transcurridos
fn_incidencias_activas_tecnico
```

## `fn_dias_transcurridos`

Calcula los días transcurridos desde `fecha_registro` de una incidencia.

## `fn_incidencias_activas_tecnico`

Cuenta las incidencias activas asignadas a un técnico.

Considera activas:

``` text
Asignada
En proceso
```

Estas funciones deben reutilizarse cuando sean útiles para reportes o
consultas del backend.

------------------------------------------------------------------------

# 8. Triggers MySQL existentes

## `trg_incidencias_validar_codigo`

Valida el código de una incidencia.

Si no se proporciona código, genera uno con formato:

``` text
INC-AAAA-0001
```

Si se proporciona un código, verifica que no esté duplicado.

Por tanto, el backend no debe duplicar innecesariamente esta lógica.

------------------------------------------------------------------------

## `trg_incidencias_historial_estado`

Cuando cambia el estado de una incidencia, registra automáticamente el
cambio en:

``` text
historial_estados
```

Utiliza las variables:

``` text
@campusfix_usuario_cambio
@campusfix_comentario
```

El backend debe establecer estas variables antes de ejecutar una
actualización de estado cuando corresponda.

------------------------------------------------------------------------

## `trg_incidencias_prevenir_delete_resuelta`

Impide eliminar físicamente una incidencia cuyo estado sea `Resuelta`.

El backend debe respetar esta restricción.

------------------------------------------------------------------------

# 9. Vistas MySQL existentes

## `vw_incidencias_activas`

Contiene información de incidencias que todavía requieren atención,
incluyendo:

-   ID.
-   Código.
-   Título.
-   Descripción.
-   Prioridad.
-   Estado.
-   Reportante.
-   Activo.
-   Ubicación.
-   Fecha de registro.
-   Fecha de actualización.
-   Días transcurridos.

## `vw_resumen_por_tecnico`

Resume las incidencias asignadas a cada técnico e incluye:

-   Técnico.
-   Total de incidencias.
-   Incidencias activas.
-   Incidencias resueltas.
-   Cantidad calculada mediante `fn_incidencias_activas_tecnico`.

Estas vistas deben evaluarse antes de crear consultas equivalentes en
JavaScript.

------------------------------------------------------------------------

# 10. MongoDB existente

La base MongoDB utilizada por Campus-Fix es:

``` text
campusfix
```

Actualmente existen dos colecciones:

``` text
diagnosticos
evidencias
```

------------------------------------------------------------------------

# 11. Colección `diagnosticos`

La colección tiene validación mediante `$jsonSchema`.

Campos obligatorios:

``` text
incidenciaId
tecnicoId
descripcion
fecha
```

Otros campos disponibles:

``` text
pruebasRealizadas
causaProbable
solucionAplicada
```

Estructura conceptual:

``` json
{
  "incidenciaId": 1,
  "tecnicoId": 3,
  "descripcion": "Descripción del diagnóstico",
  "pruebasRealizadas": [
    "Prueba 1",
    "Prueba 2"
  ],
  "causaProbable": "Causa",
  "solucionAplicada": "Solución",
  "fecha": "2026-08-01T09:00:00Z"
}
```

`incidenciaId` corresponde al `id_incidencia` existente en MySQL.

`tecnicoId` corresponde al `id_usuario` del técnico en MySQL.

La colección posee el índice:

``` text
idx_diagnosticos_incidenciaId
```

sobre:

``` text
incidenciaId
```

------------------------------------------------------------------------

# 12. Colección `evidencias`

Campos obligatorios:

``` text
incidenciaId
tipo
url
fecha
```

Campos opcionales:

``` text
nombre
descripcion
```

Los tipos permitidos son:

``` text
imagen
documento
video
```

Ejemplo:

``` json
{
  "incidenciaId": 1,
  "tipo": "imagen",
  "nombre": "proyector_lab1_01.jpg",
  "url": "https://ejemplo.local/evidencias/proyector_lab1_01.jpg",
  "descripcion": "Estado inicial del proyector",
  "fecha": "2026-08-01T08:55:00Z"
}
```

La colección posee el índice:

``` text
idx_evidencias_incidenciaId
```

sobre:

``` text
incidenciaId
```

La carga física de archivos no es obligatoria. La evidencia puede
manejarse mediante URL o ruta de referencia.

------------------------------------------------------------------------

# 13. Integración MySQL + MongoDB

La relación entre ambas bases se realiza mediante IDs.

``` text
MySQL
└── incidencias.id_incidencia
            │
            ├────────── MongoDB.diagnosticos.incidenciaId
            │
            └────────── MongoDB.evidencias.incidenciaId
```

Para los diagnósticos:

``` text
MySQL usuarios.id_usuario
            │
            └────────── MongoDB diagnosticos.tecnicoId
```

No se debe crear una segunda entidad de incidencias en MongoDB.

MySQL es la fuente de verdad para la incidencia.

MongoDB contiene la información documental relacionada con diagnóstico y
evidencia.

------------------------------------------------------------------------

# 14. Módulos funcionales requeridos

## 14.1 Inicio de sesión

Endpoint:

``` http
POST /api/auth/login
```

Debe:

1.  Recibir correo y contraseña.
2.  Buscar el usuario mediante el campo `correo`.
3.  Verificar que el usuario exista.
4.  Verificar que `activo = TRUE`.
5.  Comparar la contraseña contra `contrasena_hash`.
6.  Generar JWT.
7.  Devolver información mínima del usuario y su rol.

Las contraseñas deben protegerse con una librería apropiada como bcrypt
o Argon2.

No se debe devolver `contrasena_hash`.

------------------------------------------------------------------------

# 15. Ubicaciones y activos

El backend debe permitir trabajar con:

``` text
ubicaciones
activos
```

Cada activo se relaciona con una ubicación mediante:

``` text
activos.id_ubicacion
```

No se debe inventar una relación diferente.

------------------------------------------------------------------------

# 16. Incidencias

Una incidencia debe contener:

``` text
codigo
titulo
descripcion
prioridad
activo
usuario reportante
estado
fechas
```

El técnico se obtiene mediante `asignaciones`.

Una nueva incidencia debe iniciar en:

``` text
Registrada
```

El endpoint de registro debe utilizar la lógica existente de:

``` text
sp_registrar_incidencia
```

------------------------------------------------------------------------

# 17. Asignación y seguimiento

La asignación debe utilizar:

``` text
sp_asignar_tecnico
```

El administrador asigna un técnico.

El técnico puede trabajar sobre las incidencias que tenga asignadas y
cambiar su estado de acuerdo con el flujo permitido.

El flujo es estrictamente:

``` text
Registrada
     ↓
Asignada
     ↓
En proceso
     ↓
Resuelta
```

No se deben permitir saltos arbitrarios entre estados.

------------------------------------------------------------------------

# 18. Diagnósticos y evidencias

## Registrar diagnóstico

Endpoint:

``` http
POST /api/incidencias/:id/diagnosticos
```

El backend debe:

1.  Validar el JWT.
2.  Obtener la incidencia.
3.  Verificar el usuario técnico.
4.  Validar los campos requeridos por MongoDB.
5.  Insertar el documento en `diagnosticos`.
6.  Mantener `incidenciaId` apuntando al ID de MySQL.

## Registrar evidencia

Endpoint:

``` http
POST /api/incidencias/:id/evidencias
```

Debe validar:

``` text
tipo ∈ {imagen, documento, video}
```

y registrar los metadatos en MongoDB.

------------------------------------------------------------------------

# 19. Regla especial para resolver una incidencia

Esta regla combina las dos bases de datos.

Antes de permitir:

``` text
En proceso -> Resuelta
```

el backend debe consultar MongoDB:

``` text
diagnosticos
```

buscando:

``` text
incidenciaId = id_incidencia
```

Si no existe diagnóstico:

``` text
NO permitir Resuelta
```

Si existe:

``` text
permitir la transición
```

La lógica MySQL `sp_cambiar_estado` ya controla el flujo de estados, la
existencia de técnico para `En proceso` y otras reglas. El backend debe
complementar esta lógica con la validación de MongoDB requerida para
`Resuelta`.

------------------------------------------------------------------------

# 20. Detalle integrado de una incidencia

Endpoint:

``` http
GET /api/incidencias/:id
```

Debe integrar información de MySQL y MongoDB.

Conceptualmente:

``` text
Incidencia
├── información principal       -> MySQL
├── usuario reportante          -> MySQL
├── activo                      -> MySQL
├── ubicación                   -> MySQL
├── técnico/asignación          -> MySQL
├── historial                   -> MySQL
├── diagnóstico                 -> MongoDB
└── evidencias                  -> MongoDB
```

Para MongoDB se deben aprovechar los índices existentes por
`incidenciaId`.

------------------------------------------------------------------------

# 21. API REST mínima

  Método   Ruta                                  Propósito
  -------- ------------------------------------- -----------------------------
  POST     `/api/auth/login`                     Iniciar sesión
  POST     `/api/incidencias`                    Registrar una incidencia
  GET      `/api/incidencias`                    Listar incidencias
  GET      `/api/incidencias/:id`                Consultar detalle integrado
  PUT      `/api/incidencias/:id/asignar`        Asignar técnico
  PUT      `/api/incidencias/:id/estado`         Cambiar estado
  POST     `/api/incidencias/:id/diagnosticos`   Registrar diagnóstico
  POST     `/api/incidencias/:id/evidencias`     Registrar evidencia
  GET      `/api/reportes/estados`               Incidencias por estado
  GET      `/api/reportes/tecnicos`              Incidencias por técnico

------------------------------------------------------------------------

# 22. Reportes

## 22.1 Incidencias por estado

Endpoint:

``` http
GET /api/reportes/estados
```

Debe devolver la cantidad de incidencias agrupadas por estado.

La implementación debe aprovechar la estructura existente de MySQL.

------------------------------------------------------------------------

## 22.2 Incidencias por técnico

Endpoint:

``` http
GET /api/reportes/tecnicos
```

Debe devolver la cantidad de incidencias por técnico.

Antes de construir una consulta compleja, revisar si:

``` text
vw_resumen_por_tecnico
```

satisface la necesidad.

------------------------------------------------------------------------

# 23. Seguridad

Se debe implementar:

-   Hash de contraseñas.
-   JWT.
-   Middleware de autenticación.
-   Middleware de autorización por rol cuando corresponda.
-   Validación de datos.
-   Consultas parametrizadas.
-   Variables de entorno.
-   Manejo uniforme de errores.

No se requiere:

-   Recuperación de contraseña.
-   Verificación por correo.
-   Doble factor.
-   Administración avanzada de permisos.

------------------------------------------------------------------------

# 24. Variables de entorno

Las credenciales y secretos deben estar fuera del código fuente.

Como mínimo, se debe contemplar configuración equivalente a:

``` env
PORT=3000

MYSQL_HOST=
MYSQL_PORT=
MYSQL_DATABASE=
MYSQL_USER=
MYSQL_PASSWORD=

MONGODB_URI=

JWT_SECRET=
JWT_EXPIRES_IN=
```

Los nombres definitivos deben adaptarse al código y configuración que ya
exista.

Nunca colocar credenciales reales dentro del repositorio.

------------------------------------------------------------------------

# 25. Arquitectura del backend

La estructura objetivo es:

``` text
backend/
└── src/
    ├── app.js
    │
    ├── config/
    │   ├── mysql.js
    │   ├── mongodb.js
    │   └── env.js
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── incidencias.controller.js
    │   └── reportes.controller.js
    │
    ├── middleware/
    │   ├── auth.middleware.js
    │   ├── role.middleware.js
    │   └── error.middleware.js
    │
    ├── routes/
    │   ├── auth.routes.js
    │   ├── incidencias.routes.js
    │   └── reportes.routes.js
    │
    └── services/
        ├── auth.service.js
        ├── incidencias.service.js
        └── reportes.service.js
```

Esta estructura es una propuesta de implementación para las carpetas que
actualmente están vacías.

No se deben crear carpetas adicionales como `models`, `repositories` o
`utils` salvo que exista una necesidad real.

------------------------------------------------------------------------

# 26. Responsabilidad de cada capa

## `app.js`

Debe:

-   Crear Express.
-   Registrar JSON middleware.
-   Configurar CORS cuando corresponda.
-   Registrar rutas.
-   Registrar middleware global de errores.
-   Iniciar el servidor.

## `config/`

Debe contener conexiones y configuración.

No debe contener lógica de negocio.

## `routes/`

Debe definir las rutas HTTP y delegar a controllers.

## `controllers/`

Debe:

-   Leer parámetros.
-   Leer body.
-   Obtener información del usuario autenticado.
-   Invocar services.
-   Formar respuestas HTTP.

No debe contener lógica de negocio compleja.

## `services/`

Debe contener la lógica de negocio y acceso a las bases de datos.

Debe coordinar:

-   MySQL.
-   MongoDB.
-   Procedimientos almacenados.
-   Consultas.
-   Validaciones que requieran coordinación entre bases.

## `middleware/`

Debe contener:

-   Autenticación JWT.
-   Autorización por rol.
-   Manejo global de errores.
-   Otras validaciones reutilizables.

------------------------------------------------------------------------

# 27. Transacciones

Las operaciones que afecten varias tablas deben respetar las
transacciones existentes.

En particular:

``` text
sp_asignar_tecnico
```

ya maneja una transacción porque afecta:

``` text
asignaciones
incidencias
historial_estados
```

Asimismo:

``` text
sp_cambiar_estado
```

trabaja con transacción y utiliza el trigger para registrar el
historial.

La IA no debe duplicar estas operaciones manualmente en JavaScript si
puede ejecutar correctamente el procedimiento almacenado.

------------------------------------------------------------------------

# 28. Consultas SQL

Todas las consultas creadas directamente desde Node.js deben utilizar
parámetros.

Nunca hacer:

``` javascript
const sql = `SELECT * FROM usuarios WHERE correo = '${correo}'`;
```

Preferir:

``` javascript
const [rows] = await connection.execute(
  'SELECT ... WHERE correo = ?',
  [correo]
);
```

El mecanismo exacto dependerá del driver MySQL utilizado por el
proyecto.

------------------------------------------------------------------------

# 29. Manejo uniforme de errores

Todas las respuestas de error deben mantener una estructura consistente.

Ejemplo:

``` json
{
  "success": false,
  "message": "No se puede cambiar el estado de la incidencia"
}
```

Códigos HTTP recomendados:

``` text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Los errores provenientes de procedimientos almacenados deben
transformarse en respuestas HTTP apropiadas.

No se deben exponer:

-   Contraseñas.
-   JWT secrets.
-   Credenciales.
-   Cadenas de conexión.
-   Stack traces en producción.

------------------------------------------------------------------------

# 30. Datos de prueba requeridos

El proyecto debe cumplir como mínimo:

  Elemento                 Mínimo
  ---------------------- --------
  Roles                         3
  Usuarios                     10
  Técnicos                      3
  Ubicaciones                   5
  Activos                      15
  Incidencias                  30
  Asignaciones                 20
  Historiales                  40
  Diagnósticos MongoDB         20
  Evidencias MongoDB           20

Los datos pueden generarse mediante scripts.

No es necesario registrarlos manualmente desde el frontend.

Los scripts existentes deben revisarse antes de crear datos nuevos.

MongoDB ya cuenta con un script de pruebas que inserta:

``` text
20 diagnósticos
20 evidencias
```

vinculados a incidencias mediante `incidenciaId`.

------------------------------------------------------------------------

# 31. Postman

El proyecto tiene una carpeta:

``` text
postman/
```

Las pruebas de los endpoints deben mantenerse organizadas allí cuando
corresponda.

Para cada endpoint importante se deben contemplar:

-   Caso exitoso.
-   Datos inválidos.
-   Usuario no autenticado.
-   Usuario sin permisos.
-   Recurso inexistente.
-   Regla de negocio incumplida.

------------------------------------------------------------------------

# 32. Protocolo obligatorio de trabajo de la IA

Cuando se solicite implementar una funcionalidad, la IA debe seguir este
orden.

## Paso 1 --- Inspeccionar

Revisar:

``` text
backend/src/
database/mysql/
database/mongodb/
package.json
```

## Paso 2 --- Identificar la implementación de base de datos

Buscar:

-   Tabla correspondiente.
-   Columnas.
-   Claves.
-   Procedimientos.
-   Funciones.
-   Triggers.
-   Vistas.
-   Colecciones MongoDB.
-   Índices.

## Paso 3 --- Reutilizar

Si ya existe un procedimiento, función, trigger o vista que resuelva una
parte de la operación, utilizarlo cuando corresponda.

No duplicar lógica innecesariamente.

## Paso 4 --- Diseñar

Determinar:

``` text
route
  ↓
controller
  ↓
service
  ↓
MySQL / MongoDB
```

## Paso 5 --- Implementar

Crear únicamente los archivos necesarios.

## Paso 6 --- Probar

Probar tanto casos correctos como errores.

## Paso 7 --- Verificar reglas de negocio

Confirmar que no se hayan creado rutas que permitan saltarse las reglas.

------------------------------------------------------------------------

# 33. Reglas de negocio obligatorias

La implementación debe garantizar:

### RN-01 --- Usuario activo

Solo un usuario con `activo = TRUE` puede iniciar sesión.

### RN-02 --- Código único

Toda incidencia debe tener un código único.

La base de datos ya posee esta restricción y lógica de
generación/validación.

### RN-03 --- Estado inicial

Toda nueva incidencia comienza en:

``` text
Registrada
```

### RN-04 --- Técnico para En proceso

No se puede pasar a:

``` text
En proceso
```

sin técnico asignado.

### RN-05 --- Diagnóstico para Resuelta

No se puede pasar a:

``` text
Resuelta
```

sin diagnóstico registrado en MongoDB.

### RN-06 --- Historial

Todo cambio de estado debe conservarse en `historial_estados`.

El trigger existente registra automáticamente el cambio.

### RN-07 --- Incidencia resuelta

Una incidencia `Resuelta` no puede eliminarse físicamente.

El trigger existente impide esta operación.

### RN-08 --- Transacciones

Las operaciones que afectan varias tablas deben utilizar transacciones.

Los procedimientos existentes ya implementan transacciones para
asignación y cambio de estado.

------------------------------------------------------------------------

# 34. Restricciones para la IA

La IA NO debe:

1.  Cambiar Node.js por otro framework.
2.  Cambiar Express.js.
3.  Cambiar MySQL por otra base de datos.
4.  Eliminar MongoDB.
5.  Inventar tablas.
6.  Inventar columnas.
7.  Inventar colecciones.
8.  Duplicar procedimientos almacenados innecesariamente.
9.  Duplicar reglas de negocio ya implementadas en SQL sin
    justificación.
10. Almacenar contraseñas en texto plano.
11. Colocar credenciales en el código.
12. Permitir saltos de estados.
13. Permitir resolver una incidencia sin diagnóstico.
14. Eliminar físicamente incidencias resueltas.
15. Modificar el frontend cuando la tarea sea exclusivamente backend.
16. Crear arquitectura innecesariamente compleja.
17. Crear datos de prueba dentro del código de producción.
18. Ignorar los scripts existentes de `database/`.
19. Modificar los scripts SQL/MongoDB solo para facilitar el backend sin
    autorización.
20. Asumir que una funcionalidad no existe sin revisar primero el
    repositorio.

------------------------------------------------------------------------

# 35. Criterios de aceptación

El backend estará funcionalmente completo cuando:

-   [ ] Express inicia correctamente.
-   [ ] MySQL se conecta correctamente.
-   [ ] MongoDB se conecta correctamente.
-   [ ] Login funciona.
-   [ ] Solo usuarios activos pueden iniciar sesión.
-   [ ] Las contraseñas están protegidas.
-   [ ] JWT funciona.
-   [ ] Los roles se identifican correctamente.
-   [ ] Se pueden registrar incidencias.
-   [ ] Las incidencias comienzan en `Registrada`.
-   [ ] Se respeta el código único.
-   [ ] Se pueden listar incidencias.
-   [ ] Se puede consultar el detalle integrado.
-   [ ] Se pueden asignar técnicos.
-   [ ] Solo un Administrador puede realizar asignaciones.
-   [ ] El técnico debe estar activo y tener rol `Tecnico`.
-   [ ] Se puede cambiar el estado.
-   [ ] Se respeta el flujo de estados.
-   [ ] No se puede pasar a `En proceso` sin técnico.
-   [ ] Se registran diagnósticos en MongoDB.
-   [ ] Se registran evidencias en MongoDB.
-   [ ] No se puede pasar a `Resuelta` sin diagnóstico.
-   [ ] Se conserva el historial.
-   [ ] Una incidencia resuelta no se puede eliminar físicamente.
-   [ ] Funcionan los reportes por estado.
-   [ ] Funcionan los reportes por técnico.
-   [ ] Se utilizan consultas parametrizadas.
-   [ ] Las credenciales utilizan variables de entorno.
-   [ ] Los errores tienen respuestas uniformes.
-   [ ] Los datos de prueba cumplen los mínimos establecidos.

------------------------------------------------------------------------

# 36. Principio final

La IA debe priorizar:

``` text
1. Integridad de datos
2. Seguridad
3. Cumplimiento de reglas de negocio
4. Reutilización de la lógica existente
5. Simplicidad
6. Mantenibilidad
7. Compatibilidad con el frontend
```

La regla más importante es:

> **No reinventar la base de datos. El backend debe adaptarse a la base
> de datos existente.**

Antes de escribir código, leer primero los archivos correspondientes de
`database/mysql` y `database/mongodb`.
