USE campusfix;

-- 1. ROLES

CREATE TABLE roles (
    id_rol INT UNSIGNED AUTO_INCREMENT,
    nombre_rol VARCHAR(30) NOT NULL,
    descripcion VARCHAR(150),

    CONSTRAINT pk_roles
        PRIMARY KEY (id_rol),

    CONSTRAINT uq_roles_nombre
        UNIQUE (nombre_rol)
) ENGINE=InnoDB;

-- 2. USUARIOS

CREATE TABLE usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT,
    id_rol INT UNSIGNED NOT NULL,
    nombres VARCHAR(60) NOT NULL,
    apellidos VARCHAR(60) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuarios
        PRIMARY KEY (id_usuario),

    CONSTRAINT uq_usuarios_correo
        UNIQUE (correo),

    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. UBICACIONES

CREATE TABLE ubicaciones (
    id_ubicacion INT UNSIGNED AUTO_INCREMENT,
    nombre VARCHAR(60) NOT NULL,
    tipo VARCHAR(30),
    edificio VARCHAR(60),

    CONSTRAINT pk_ubicaciones
        PRIMARY KEY (id_ubicacion)
) ENGINE=InnoDB;

-- 4. ACTIVOS

CREATE TABLE activos (
    id_activo INT UNSIGNED AUTO_INCREMENT,
    id_ubicacion INT UNSIGNED NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    codigo_inventario VARCHAR(30),
    estado_activo VARCHAR(20) NOT NULL DEFAULT 'Operativo',

    CONSTRAINT pk_activos
        PRIMARY KEY (id_activo),

    CONSTRAINT uq_activos_codigo
        UNIQUE (codigo_inventario),

    CONSTRAINT ck_activos_estado
        CHECK (
            estado_activo IN ('Operativo', 'Fuera de servicio')
        ),

    CONSTRAINT fk_activos_ubicacion
        FOREIGN KEY (id_ubicacion)
        REFERENCES ubicaciones(id_ubicacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 5. ESTADOS DE INCIDENCIA

CREATE TABLE estados_incidencia (
    id_estado INT UNSIGNED AUTO_INCREMENT,
    nombre_estado VARCHAR(20) NOT NULL,
    orden TINYINT UNSIGNED NOT NULL,

    CONSTRAINT pk_estados_incidencia
        PRIMARY KEY (id_estado),

    CONSTRAINT uq_estados_nombre
        UNIQUE (nombre_estado),

    CONSTRAINT uq_estados_orden
        UNIQUE (orden),

    CONSTRAINT ck_estados_orden
        CHECK (orden BETWEEN 1 AND 4)
) ENGINE=InnoDB;

-- 6. INCIDENCIAS

CREATE TABLE incidencias (
    id_incidencia INT UNSIGNED AUTO_INCREMENT,
    codigo VARCHAR(20) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    prioridad VARCHAR(10) NOT NULL,
    id_activo INT UNSIGNED,
    id_usuario_reporta INT UNSIGNED NOT NULL,
    id_estado INT UNSIGNED NOT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_incidencias
        PRIMARY KEY (id_incidencia),

    CONSTRAINT uq_incidencias_codigo
        UNIQUE (codigo),

    CONSTRAINT ck_incidencias_prioridad
        CHECK (
            prioridad IN ('Baja', 'Media', 'Alta')
        ),

    CONSTRAINT fk_incidencias_activo
        FOREIGN KEY (id_activo)
        REFERENCES activos(id_activo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_incidencias_usuario
        FOREIGN KEY (id_usuario_reporta)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_incidencias_estado
        FOREIGN KEY (id_estado)
        REFERENCES estados_incidencia(id_estado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. ASIGNACIONES

CREATE TABLE asignaciones (
    id_asignacion INT UNSIGNED AUTO_INCREMENT,
    id_incidencia INT UNSIGNED NOT NULL,
    id_tecnico INT UNSIGNED NOT NULL,
    asignado_por INT UNSIGNED NOT NULL,
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_asignaciones
        PRIMARY KEY (id_asignacion),

    CONSTRAINT fk_asignaciones_incidencia
        FOREIGN KEY (id_incidencia)
        REFERENCES incidencias(id_incidencia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_asignaciones_tecnico
        FOREIGN KEY (id_tecnico)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_asignaciones_asignado_por
        FOREIGN KEY (asignado_por)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 8. HISTORIAL DE ESTADOS

CREATE TABLE historial_estados (
    id_historial INT UNSIGNED AUTO_INCREMENT,
    id_incidencia INT UNSIGNED NOT NULL,
    id_estado INT UNSIGNED NOT NULL,
    id_usuario_cambio INT UNSIGNED NOT NULL,
    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentario VARCHAR(200),

    CONSTRAINT pk_historial_estados
        PRIMARY KEY (id_historial),

    CONSTRAINT fk_historial_incidencia
        FOREIGN KEY (id_incidencia)
        REFERENCES incidencias(id_incidencia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_historial_estado
        FOREIGN KEY (id_estado)
        REFERENCES estados_incidencia(id_estado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (id_usuario_cambio)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 9. ÍNDICES

CREATE INDEX idx_incidencias_estado
    ON incidencias(id_estado);

CREATE INDEX idx_incidencias_usuario
    ON incidencias(id_usuario_reporta);

CREATE INDEX idx_incidencias_activo
    ON incidencias(id_activo);

CREATE INDEX idx_asignaciones_tecnico
    ON asignaciones(id_tecnico);

CREATE INDEX idx_historial_incidencia
    ON historial_estados(id_incidencia);