USE campusfix;

-- ============================================================
-- CAMPUS-FIX
-- 03_programacion.sql
--
-- Procedimientos almacenados
-- Funciones
-- Triggers
-- Vistas
-- ============================================================


-- ============================================================
-- LIMPIEZA DE OBJETOS PROGRAMABLES
-- ============================================================

DROP TRIGGER IF EXISTS trg_incidencias_validar_codigo;
DROP TRIGGER IF EXISTS trg_incidencias_historial_estado;
DROP TRIGGER IF EXISTS trg_incidencias_prevenir_delete_resuelta;

DROP PROCEDURE IF EXISTS sp_registrar_incidencia;
DROP PROCEDURE IF EXISTS sp_asignar_tecnico;
DROP PROCEDURE IF EXISTS sp_cambiar_estado;

DROP FUNCTION IF EXISTS fn_dias_transcurridos;
DROP FUNCTION IF EXISTS fn_incidencias_activas_tecnico;

DROP VIEW IF EXISTS vw_incidencias_activas;
DROP VIEW IF EXISTS vw_resumen_por_tecnico;


-- ============================================================
-- PROCEDIMIENTO 1
-- sp_registrar_incidencia
--
-- Registra una nueva incidencia.
--
-- Reglas:
-- - Código obligatorio y único.
-- - Usuario reportante debe existir y estar activo.
-- - Estado inicial siempre será Registrada.
-- - Prioridad debe ser Baja, Media o Alta.
-- ============================================================

DELIMITER $$

CREATE PROCEDURE sp_registrar_incidencia(
    IN p_codigo VARCHAR(20),
    IN p_titulo VARCHAR(150),
    IN p_descripcion TEXT,
    IN p_prioridad VARCHAR(10),
    IN p_id_activo INT,
    IN p_id_usuario_reporta INT
)
BEGIN
    DECLARE v_id_estado INT;
    DECLARE v_usuario_activo BOOLEAN DEFAULT FALSE;
    DECLARE v_codigo_existe INT DEFAULT 0;

    -- Validar código
    IF p_codigo IS NULL OR TRIM(p_codigo) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El codigo de la incidencia es obligatorio';
    END IF;

    -- Validar título
    IF p_titulo IS NULL OR TRIM(p_titulo) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El titulo de la incidencia es obligatorio';
    END IF;

    -- Validar descripción
    IF p_descripcion IS NULL OR TRIM(p_descripcion) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La descripcion de la incidencia es obligatoria';
    END IF;

    -- Validar prioridad
    IF p_prioridad NOT IN ('Baja', 'Media', 'Alta') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La prioridad debe ser Baja, Media o Alta';
    END IF;

    -- Validar usuario
    SELECT activo
    INTO v_usuario_activo
    FROM usuarios
    WHERE id_usuario = p_id_usuario_reporta;

    IF v_usuario_activo IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El usuario reportante no existe';
    END IF;

    IF v_usuario_activo = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El usuario reportante esta inactivo';
    END IF;

    -- Validar código único
    SELECT COUNT(*)
    INTO v_codigo_existe
    FROM incidencias
    WHERE codigo = p_codigo;

    IF v_codigo_existe > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El codigo de incidencia ya existe';
    END IF;

    -- Obtener estado Registrada
    SELECT id_estado
    INTO v_id_estado
    FROM estados_incidencia
    WHERE nombre_estado = 'Registrada';

    IF v_id_estado IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No existe el estado Registrada';
    END IF;

    -- Registrar incidencia
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
        p_codigo,
        p_titulo,
        p_descripcion,
        p_prioridad,
        p_id_activo,
        p_id_usuario_reporta,
        v_id_estado
    );

    SELECT
        LAST_INSERT_ID() AS id_incidencia,
        p_codigo AS codigo,
        'Incidencia registrada correctamente' AS mensaje;

END$$

DELIMITER ;


-- ============================================================
-- PROCEDIMIENTO 2
-- sp_asignar_tecnico
--
-- Asigna una incidencia a un técnico.
--
-- La operación afecta:
-- 1. asignaciones
-- 2. incidencias
-- 3. historial_estados mediante trigger
--
-- Por eso se ejecuta dentro de una transacción.
-- ============================================================

DELIMITER $$

CREATE PROCEDURE sp_asignar_tecnico(
    IN p_id_incidencia INT,
    IN p_id_tecnico INT,
    IN p_asignado_por INT
)
BEGIN
    DECLARE v_id_estado_actual INT;
    DECLARE v_nombre_estado VARCHAR(20);
    DECLARE v_rol_tecnico VARCHAR(30);
    DECLARE v_rol_admin VARCHAR(30);
    DECLARE v_tecnico_activo BOOLEAN;
    DECLARE v_admin_activo BOOLEAN;
    DECLARE v_id_estado_asignada INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- --------------------------------------------------------
    -- Validar incidencia
    -- --------------------------------------------------------

    SELECT i.id_estado, e.nombre_estado
    INTO v_id_estado_actual, v_nombre_estado
    FROM incidencias i
    INNER JOIN estados_incidencia e
        ON e.id_estado = i.id_estado
    WHERE i.id_incidencia = p_id_incidencia
    FOR UPDATE;

    IF v_id_estado_actual IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La incidencia no existe';
    END IF;

    -- No permitir asignar una incidencia ya resuelta
    IF v_nombre_estado = 'Resuelta' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede asignar una incidencia resuelta';
    END IF;

    -- --------------------------------------------------------
    -- Validar técnico
    -- --------------------------------------------------------

    SELECT
        u.activo,
        r.nombre_rol
    INTO
        v_tecnico_activo,
        v_rol_tecnico
    FROM usuarios u
    INNER JOIN roles r
        ON r.id_rol = u.id_rol
    WHERE u.id_usuario = p_id_tecnico;

    IF v_tecnico_activo IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El tecnico no existe';
    END IF;

    IF v_tecnico_activo = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El tecnico esta inactivo';
    END IF;

    IF v_rol_tecnico <> 'Tecnico' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El usuario indicado no tiene rol de Tecnico';
    END IF;

    -- --------------------------------------------------------
    -- Validar administrador
    -- --------------------------------------------------------

    SELECT
        u.activo,
        r.nombre_rol
    INTO
        v_admin_activo,
        v_rol_admin
    FROM usuarios u
    INNER JOIN roles r
        ON r.id_rol = u.id_rol
    WHERE u.id_usuario = p_asignado_por;

    IF v_admin_activo IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El usuario que realiza la asignacion no existe';
    END IF;

    IF v_admin_activo = FALSE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El administrador esta inactivo';
    END IF;

    IF v_rol_admin <> 'Administrador' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo un Administrador puede asignar tecnicos';
    END IF;

    -- --------------------------------------------------------
    -- Obtener estado Asignada
    -- --------------------------------------------------------

    SELECT id_estado
    INTO v_id_estado_asignada
    FROM estados_incidencia
    WHERE nombre_estado = 'Asignada';

    IF v_id_estado_asignada IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No existe el estado Asignada';
    END IF;

    -- --------------------------------------------------------
    -- Registrar asignación
    -- --------------------------------------------------------

    INSERT INTO asignaciones (
        id_incidencia,
        id_tecnico,
        asignado_por
    )
    VALUES (
        p_id_incidencia,
        p_id_tecnico,
        p_asignado_por
    );

    -- --------------------------------------------------------
    -- Cambiar estado
    -- El trigger registrará automáticamente el historial.
    -- --------------------------------------------------------
    
    SET @campusfix_usuario_cambio = p_asignado_por;
	SET @campusfix_comentario = 'Incidencia asignada a tecnico';

    UPDATE incidencias
    SET id_estado = v_id_estado_asignada
    WHERE id_incidencia = p_id_incidencia;

    COMMIT;

    SELECT
        p_id_incidencia AS id_incidencia,
        p_id_tecnico AS id_tecnico,
        'Incidencia asignada correctamente' AS mensaje;

END$$

DELIMITER ;


-- ============================================================
-- PROCEDIMIENTO 3
-- sp_cambiar_estado
--
-- Cambia el estado de una incidencia.
--
-- Validaciones:
-- - La incidencia debe existir.
-- - El estado debe existir.
-- - Para En proceso debe existir técnico asignado.
-- - No permite cambios después de Resuelta.
--
-- La validación del diagnóstico para Resuelta se realizará
-- posteriormente en el backend consultando MongoDB.
-- ============================================================

DELIMITER $$

CREATE PROCEDURE sp_cambiar_estado(
    IN p_id_incidencia INT,
    IN p_id_estado_nuevo INT,
    IN p_id_usuario_cambio INT,
    IN p_comentario VARCHAR(200)
)
BEGIN
    DECLARE v_id_estado_actual INT;
    DECLARE v_nombre_estado_actual VARCHAR(20);
    DECLARE v_nombre_estado_nuevo VARCHAR(20);
    DECLARE v_tiene_tecnico INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- --------------------------------------------------------
    -- Obtener estado actual
    -- --------------------------------------------------------

    SELECT
        i.id_estado,
        e.nombre_estado
    INTO
        v_id_estado_actual,
        v_nombre_estado_actual
    FROM incidencias i
    INNER JOIN estados_incidencia e
        ON e.id_estado = i.id_estado
    WHERE i.id_incidencia = p_id_incidencia
    FOR UPDATE;

    IF v_id_estado_actual IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La incidencia no existe';
    END IF;

    -- --------------------------------------------------------
    -- Obtener nuevo estado
    -- --------------------------------------------------------

    SELECT nombre_estado
    INTO v_nombre_estado_nuevo
    FROM estados_incidencia
    WHERE id_estado = p_id_estado_nuevo;

    IF v_nombre_estado_nuevo IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El nuevo estado no existe';
    END IF;

    -- --------------------------------------------------------
    -- No modificar una incidencia resuelta
    -- --------------------------------------------------------

    IF v_nombre_estado_actual = 'Resuelta' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Una incidencia resuelta no puede cambiar de estado';
    END IF;

    -- --------------------------------------------------------
    -- Validar flujo de estados
    --
    -- Registrada -> Asignada
    -- Asignada -> En proceso
    -- En proceso -> Resuelta
    -- --------------------------------------------------------

    IF v_nombre_estado_actual = 'Registrada'
       AND v_nombre_estado_nuevo NOT IN ('Asignada') THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Desde Registrada solo se puede pasar a Asignada';

    ELSEIF v_nombre_estado_actual = 'Asignada'
       AND v_nombre_estado_nuevo NOT IN ('En proceso') THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Desde Asignada solo se puede pasar a En proceso';

    ELSEIF v_nombre_estado_actual = 'En proceso'
       AND v_nombre_estado_nuevo NOT IN ('Resuelta') THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Desde En proceso solo se puede pasar a Resuelta';

    END IF;

    -- --------------------------------------------------------
    -- RN4: En proceso requiere técnico asignado
    -- --------------------------------------------------------

    IF v_nombre_estado_nuevo = 'En proceso' THEN

        SELECT COUNT(*)
        INTO v_tiene_tecnico
        FROM asignaciones
        WHERE id_incidencia = p_id_incidencia;

        IF v_tiene_tecnico = 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'No se puede pasar a En proceso sin tecnico asignado';
        END IF;

    END IF;

    -- --------------------------------------------------------
    -- Actualizar estado
    --
    -- El trigger registra automáticamente el historial.
    -- --------------------------------------------------------

    SET @campusfix_usuario_cambio = p_id_usuario_cambio;
	SET @campusfix_comentario = p_comentario;
    
    UPDATE incidencias
    SET id_estado = p_id_estado_nuevo
    WHERE id_incidencia = p_id_incidencia;

    COMMIT;

    SELECT
        p_id_incidencia AS id_incidencia,
        v_nombre_estado_nuevo AS nuevo_estado,
        'Estado actualizado correctamente' AS mensaje;

END$$

DELIMITER ;


-- ============================================================
-- FUNCIÓN 1
-- fn_dias_transcurridos
--
-- Calcula los días transcurridos desde el registro
-- de una incidencia hasta la fecha actual.
-- ============================================================

DELIMITER $$

CREATE FUNCTION fn_dias_transcurridos(
    p_id_incidencia INT
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_fecha_registro DATETIME;
    DECLARE v_dias INT;

    SELECT fecha_registro
    INTO v_fecha_registro
    FROM incidencias
    WHERE id_incidencia = p_id_incidencia;

    IF v_fecha_registro IS NULL THEN
        RETURN NULL;
    END IF;

    SET v_dias = DATEDIFF(CURRENT_DATE, DATE(v_fecha_registro));

    RETURN v_dias;
END$$

DELIMITER ;


-- ============================================================
-- FUNCIÓN 2
-- fn_incidencias_activas_tecnico
--
-- Devuelve la cantidad de incidencias activas asignadas
-- a un técnico.
--
-- Estados considerados activos:
-- - Asignada
-- - En proceso
-- ============================================================

DELIMITER $$

CREATE FUNCTION fn_incidencias_activas_tecnico(
    p_id_tecnico INT
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT DEFAULT 0;

    SELECT COUNT(DISTINCT a.id_incidencia)
    INTO v_total
    FROM asignaciones a
    INNER JOIN incidencias i
        ON i.id_incidencia = a.id_incidencia
    INNER JOIN estados_incidencia e
        ON e.id_estado = i.id_estado
    WHERE a.id_tecnico = p_id_tecnico
      AND e.nombre_estado IN ('Asignada', 'En proceso');

    RETURN v_total;
END$$

DELIMITER ;


-- ============================================================
-- TRIGGER 1
-- trg_incidencias_validar_codigo
--
-- Valida/genera el código de una incidencia.
--
-- Si no se proporciona código, genera uno utilizando
-- el siguiente formato:
--
-- INC-AAAA-0001
--
-- Si se proporciona un código, verifica que no exista.
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_incidencias_validar_codigo
BEFORE INSERT ON incidencias
FOR EACH ROW
BEGIN
    DECLARE v_codigo_generado VARCHAR(20);
    DECLARE v_existe INT DEFAULT 0;

    -- Generar código si llega vacío.
    IF NEW.codigo IS NULL OR TRIM(NEW.codigo) = '' THEN

        SET v_codigo_generado = CONCAT(
            'INC-',
            YEAR(CURRENT_DATE),
            '-',
            LPAD(
                (
                    SELECT COALESCE(MAX(id_incidencia), 0) + 1
                    FROM incidencias
                ),
                4,
                '0'
            )
        );

        SET NEW.codigo = v_codigo_generado;

    ELSE

        -- Validar que el código no esté duplicado.
        SELECT COUNT(*)
        INTO v_existe
        FROM incidencias
        WHERE codigo = NEW.codigo;

        IF v_existe > 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'El codigo de incidencia ya existe';
        END IF;

    END IF;

END$$

DELIMITER ;


-- ============================================================
-- TRIGGER 2
-- trg_incidencias_historial_estado
--
-- Cada vez que cambia el estado de una incidencia,
-- registra automáticamente el cambio en historial_estados.
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_incidencias_historial_estado
AFTER UPDATE ON incidencias
FOR EACH ROW
BEGIN

    IF NOT (OLD.id_estado <=> NEW.id_estado) THEN

        INSERT INTO historial_estados (
            id_incidencia,
            id_estado,
            id_usuario_cambio,
            comentario
        )
        VALUES (
            NEW.id_incidencia,
            NEW.id_estado,
            @campusfix_usuario_cambio,
            @campusfix_comentario
        );

    END IF;

END$$

DELIMITER ;


-- ============================================================
-- TRIGGER 3
-- trg_incidencias_prevenir_delete_resuelta
--
-- Impide eliminar físicamente una incidencia que ya está
-- en estado Resuelta.
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_incidencias_prevenir_delete_resuelta
BEFORE DELETE ON incidencias
FOR EACH ROW
BEGIN
    DECLARE v_nombre_estado VARCHAR(20);

    SELECT nombre_estado
    INTO v_nombre_estado
    FROM estados_incidencia
    WHERE id_estado = OLD.id_estado;

    IF v_nombre_estado = 'Resuelta' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede eliminar fisicamente una incidencia resuelta';
    END IF;

END$$

DELIMITER ;


-- ============================================================
-- VISTA 1
-- vw_incidencias_activas
--
-- Muestra las incidencias que todavía requieren atención.
-- ============================================================

CREATE VIEW vw_incidencias_activas AS
SELECT
    i.id_incidencia,
    i.codigo,
    i.titulo,
    i.descripcion,
    i.prioridad,
    e.nombre_estado AS estado,
    CONCAT(u.nombres, ' ', u.apellidos) AS reportante,
    a.nombre AS activo,
    ub.nombre AS ubicacion,
    i.fecha_registro,
    i.fecha_actualizacion,
    fn_dias_transcurridos(i.id_incidencia) AS dias_transcurridos
FROM incidencias i
INNER JOIN estados_incidencia e
    ON e.id_estado = i.id_estado
INNER JOIN usuarios u
    ON u.id_usuario = i.id_usuario_reporta
LEFT JOIN activos a
    ON a.id_activo = i.id_activo
LEFT JOIN ubicaciones ub
    ON ub.id_ubicacion = a.id_ubicacion
WHERE e.nombre_estado IN ('Registrada', 'Asignada', 'En proceso');


-- ============================================================
-- VISTA 2
-- vw_resumen_por_tecnico
--
-- Resume la cantidad de incidencias asignadas a cada técnico.
-- ============================================================

CREATE VIEW vw_resumen_por_tecnico AS
SELECT
    u.id_usuario AS id_tecnico,
    CONCAT(u.nombres, ' ', u.apellidos) AS tecnico,
    COUNT(DISTINCT a.id_incidencia) AS total_incidencias,
    COUNT(
        DISTINCT CASE
            WHEN e.nombre_estado IN ('Asignada', 'En proceso')
            THEN a.id_incidencia
        END
    ) AS incidencias_activas,
    COUNT(
        DISTINCT CASE
            WHEN e.nombre_estado = 'Resuelta'
            THEN a.id_incidencia
        END
    ) AS incidencias_resueltas,
    fn_incidencias_activas_tecnico(u.id_usuario) AS funcion_incidencias_activas
FROM usuarios u
INNER JOIN roles r
    ON r.id_rol = u.id_rol
LEFT JOIN asignaciones a
    ON a.id_tecnico = u.id_usuario
LEFT JOIN incidencias i
    ON i.id_incidencia = a.id_incidencia
LEFT JOIN estados_incidencia e
    ON e.id_estado = i.id_estado
WHERE r.nombre_rol = 'Tecnico'
GROUP BY
    u.id_usuario,
    u.nombres,
    u.apellidos;