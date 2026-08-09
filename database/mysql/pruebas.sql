USE campusfix;

-- ============================================================
-- 1. PRUEBA: sp_registrar_incidencia
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '1. sp_registrar_incidencia' AS prueba;

CALL sp_registrar_incidencia(
    'TEST-0001',
    'Prueba de registro de incidencia',
    'Incidencia creada para comprobar el procedimiento almacenado.',
    'Media',
    1,
    6
);

SELECT
    id_incidencia,
    codigo,
    titulo,
    prioridad,
    id_usuario_reporta
FROM incidencias
WHERE codigo = 'TEST-0001';


-- ============================================================
-- 2. PRUEBA: fn_dias_transcurridos
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '2. fn_dias_transcurridos' AS prueba;

SELECT
    id_incidencia,
    codigo,
    fecha_registro,
    fn_dias_transcurridos(id_incidencia) AS dias_transcurridos
FROM incidencias
WHERE id_incidencia = 4;


-- ============================================================
-- 3. PRUEBA: sp_asignar_tecnico
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '3. sp_asignar_tecnico' AS prueba;

CALL sp_asignar_tecnico(
    (SELECT id_incidencia
     FROM incidencias
     WHERE codigo = 'TEST-0001'),
    3,
    1
);

SELECT
    i.id_incidencia,
    i.codigo,
    e.nombre_estado AS estado,
    a.id_tecnico,
    CONCAT(u.nombres, ' ', u.apellidos) AS tecnico
FROM incidencias i
INNER JOIN estados_incidencia e
    ON e.id_estado = i.id_estado
INNER JOIN asignaciones a
    ON a.id_incidencia = i.id_incidencia
INNER JOIN usuarios u
    ON u.id_usuario = a.id_tecnico
WHERE i.codigo = 'TEST-0001';


-- ============================================================
-- 4. PRUEBA: sp_cambiar_estado
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '4. sp_cambiar_estado' AS prueba;

SET @id_test_incidencia = (
    SELECT id_incidencia
    FROM incidencias
    WHERE codigo = 'TEST-0001'
);

SELECT id_estado
INTO @id_estado_proceso
FROM estados_incidencia
WHERE nombre_estado = 'En proceso';

SET @campusfix_usuario_cambio = 3;
SET @campusfix_comentario = 'Inicio de atencion de prueba';

CALL sp_cambiar_estado(
    @id_test_incidencia,
    @id_estado_proceso,
    3,
    'Inicio de atencion de prueba'
);

SELECT
    i.id_incidencia,
    i.codigo,
    e.nombre_estado AS estado_actual
FROM incidencias i
INNER JOIN estados_incidencia e
    ON e.id_estado = i.id_estado
WHERE i.id_incidencia = @id_test_incidencia;


-- ============================================================
-- 5. PRUEBA DEL TRIGGER DE HISTORIAL
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '5. Trigger de historial de estados' AS prueba;

SELECT
    h.id_historial,
    h.id_incidencia,
    e.nombre_estado,
    h.id_usuario_cambio,
    h.fecha_cambio,
    h.comentario
FROM historial_estados h
INNER JOIN estados_incidencia e
    ON e.id_estado = h.id_estado
WHERE h.id_incidencia = @id_test_incidencia
ORDER BY h.fecha_cambio;


-- ============================================================
-- 6. PRUEBA: fn_incidencias_activas_tecnico
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '6. fn_incidencias_activas_tecnico' AS prueba;

SELECT
    id_usuario AS id_tecnico,
    CONCAT(nombres, ' ', apellidos) AS tecnico,
    fn_incidencias_activas_tecnico(id_usuario) AS incidencias_activas
FROM usuarios
WHERE id_usuario = 3;


-- ============================================================
-- 7. PRUEBA: vw_incidencias_activas
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '7. vw_incidencias_activas' AS prueba;

SELECT *
FROM vw_incidencias_activas
ORDER BY fecha_registro DESC;


-- ============================================================
-- 8. PRUEBA: vw_resumen_por_tecnico
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '8. vw_resumen_por_tecnico' AS prueba;

SELECT *
FROM vw_resumen_por_tecnico
ORDER BY tecnico;


-- ============================================================
-- 9. PRUEBA DEL TRIGGER DE CÓDIGO
-- ============================================================
--
-- Se intenta insertar una incidencia sin código.
-- El trigger debe generar automáticamente un código.
--
-- Esta prueba se realiza dentro de una transacción para
-- posteriormente deshacer el registro.
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '9. Trigger de generación de código' AS prueba;

START TRANSACTION;

INSERT INTO incidencias (
    codigo,
    titulo,
    descripcion,
    prioridad,
    id_activo,
    id_usuario_reporta,
    id_estado
)
VALUES (
    '',
    'Prueba de codigo automatico',
    'Prueba del trigger de generacion automatica.',
    'Baja',
    2,
    7,
    (
        SELECT id_estado
        FROM estados_incidencia
        WHERE nombre_estado = 'Registrada'
    )
);

SELECT
    id_incidencia,
    codigo,
    titulo
FROM incidencias
WHERE id_incidencia = LAST_INSERT_ID();

ROLLBACK;


-- ============================================================
-- 10. PRUEBA DE TRANSACCIÓN CON COMMIT
-- ============================================================
--
-- Operación:
-- 1. Crear incidencia.
-- 2. Asignarla a un técnico.
-- 3. Confirmar con COMMIT.
--
-- Esta operación debe permanecer después del COMMIT.
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '10. TRANSACCION COMMIT' AS prueba;

START TRANSACTION;

INSERT INTO incidencias (
    codigo,
    titulo,
    descripcion,
    prioridad,
    id_activo,
    id_usuario_reporta,
    id_estado
)
VALUES (
    'TRX-COMMIT-001',
    'Incidencia transaccional',
    'Prueba de transaccion confirmada.',
    'Media',
    4,
    6,
    (
        SELECT id_estado
        FROM estados_incidencia
        WHERE nombre_estado = 'Registrada'
    )
);

SET @id_trx_commit = LAST_INSERT_ID();

INSERT INTO asignaciones (
    id_incidencia,
    id_tecnico,
    asignado_por
)
VALUES (
    @id_trx_commit,
    3,
    1
);

UPDATE incidencias
SET id_estado = (
    SELECT id_estado
    FROM estados_incidencia
    WHERE nombre_estado = 'Asignada'
)
WHERE id_incidencia = @id_trx_commit;

COMMIT;

SELECT
    i.id_incidencia,
    i.codigo,
    e.nombre_estado AS estado,
    a.id_tecnico
FROM incidencias i
INNER JOIN estados_incidencia e
    ON e.id_estado = i.id_estado
LEFT JOIN asignaciones a
    ON a.id_incidencia = i.id_incidencia
WHERE i.id_incidencia = @id_trx_commit;


-- ============================================================
-- 11. PRUEBA DE TRANSACCIÓN CON ROLLBACK
-- ============================================================
--
-- Operación:
-- 1. Crear incidencia.
-- 2. Asignar técnico.
-- 3. Ejecutar ROLLBACK.
--
-- El registro NO debe permanecer.
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '11. TRANSACCION ROLLBACK' AS prueba;

START TRANSACTION;

INSERT INTO incidencias (
    codigo,
    titulo,
    descripcion,
    prioridad,
    id_activo,
    id_usuario_reporta,
    id_estado
)
VALUES (
    'TRX-ROLLBACK-001',
    'Incidencia cancelada',
    'Prueba de transaccion revertida.',
    'Alta',
    5,
    7,
    (
        SELECT id_estado
        FROM estados_incidencia
        WHERE nombre_estado = 'Registrada'
    )
);

SET @id_trx_rollback = LAST_INSERT_ID();

INSERT INTO asignaciones (
    id_incidencia,
    id_tecnico,
    asignado_por
)
VALUES (
    @id_trx_rollback,
    4,
    1
);

UPDATE incidencias
SET id_estado = (
    SELECT id_estado
    FROM estados_incidencia
    WHERE nombre_estado = 'Asignada'
)
WHERE id_incidencia = @id_trx_rollback;

ROLLBACK;

SELECT
    COUNT(*) AS registros_despues_rollback
FROM incidencias
WHERE codigo = 'TRX-ROLLBACK-001';


-- ============================================================
-- 12. PRUEBA DEL TRIGGER QUE PROHIBE ELIMINAR RESUELTAS
-- ============================================================
--
-- Primero creamos una incidencia temporal.
-- La pasamos a Resuelta.
-- Luego intentamos eliminarla.
--
-- El trigger debe impedir el DELETE.
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '12. Trigger de proteccion de incidencias resueltas' AS prueba;

START TRANSACTION;

INSERT INTO incidencias (
    codigo,
    titulo,
    descripcion,
    prioridad,
    id_activo,
    id_usuario_reporta,
    id_estado
)
VALUES (
    'TEST-DELETE-001',
    'Prueba de proteccion',
    'Incidencia para probar el bloqueo de eliminacion.',
    'Baja',
    8,
    8,
    (
        SELECT id_estado
        FROM estados_incidencia
        WHERE nombre_estado = 'Resuelta'
    )
);

SET @id_delete_test = LAST_INSERT_ID();

-- Intento de eliminación.
-- Debe producir el error del trigger.
DELETE FROM incidencias
WHERE id_incidencia = @id_delete_test;

ROLLBACK;


-- ============================================================
-- 13. VERIFICACIÓN FINAL
-- ============================================================

SELECT '==================================================' AS prueba;
SELECT '13. Verificacion final de objetos' AS prueba;

SELECT
    'Procedimientos' AS objeto,
    COUNT(*) AS cantidad
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'campusfix'
  AND ROUTINE_TYPE = 'PROCEDURE'

UNION ALL

SELECT
    'Funciones',
    COUNT(*)
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'campusfix'
  AND ROUTINE_TYPE = 'FUNCTION'

UNION ALL

SELECT
    'Triggers',
    COUNT(*)
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'campusfix'

UNION ALL

SELECT
    'Vistas',
    COUNT(*)
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'campusfix';


-- ============================================================
-- FIN DE 04_pruebas.sql
-- ============================================================