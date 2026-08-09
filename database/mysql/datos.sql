USE campusfix;

-- 1. ROLES

INSERT INTO roles (nombre_rol, descripcion)
VALUES
    ('Administrador', 'Gestiona usuarios, incidencias y asignaciones'),
    ('Tecnico', 'Atiende y resuelve incidencias técnicas'),
    ('Usuario', 'Registra y consulta sus incidencias');

-- 2. USUARIOS
-- ============================================================
-- Las contraseñas son hashes de prueba.
-- En producción serán generadas mediante bcrypt desde el backend.
-- ============================================================

INSERT INTO usuarios (
    id_rol,
    nombres,
    apellidos,
    correo,
    contrasena_hash,
    activo
)
VALUES
    (
        1,
        'Carlos',
        'Mendoza',
        'carlos.mendoza@ecotec.edu.ec',
        '$2b$10$CampusFixHashAdmin001',
        TRUE
    ),
    (
        1,
        'Maria',
        'Gonzalez',
        'maria.gonzalez@ecotec.edu.ec',
        '$2b$10$CampusFixHashAdmin002',
        TRUE
    ),
    (
        2,
        'Andres',
        'Vera',
        'andres.vera@ecotec.edu.ec',
        '$2b$10$CampusFixHashTecnico001',
        TRUE
    ),
    (
        2,
        'Daniel',
        'Torres',
        'daniel.torres@ecotec.edu.ec',
        '$2b$10$CampusFixHashTecnico002',
        TRUE
    ),
    (
        2,
        'Luis',
        'Paredes',
        'luis.paredes@ecotec.edu.ec',
        '$2b$10$CampusFixHashTecnico003',
        TRUE
    ),
    (
        3,
        'Juan',
        'Perez',
        'juan.perez@ecotec.edu.ec',
        '$2b$10$CampusFixHashUsuario001',
        TRUE
    ),
    (
        3,
        'Ana',
        'Rodriguez',
        'ana.rodriguez@ecotec.edu.ec',
        '$2b$10$CampusFixHashUsuario002',
        TRUE
    ),
    (
        3,
        'Pedro',
        'Sanchez',
        'pedro.sanchez@ecotec.edu.ec',
        '$2b$10$CampusFixHashUsuario003',
        TRUE
    );

-- 3. UBICACIONES

INSERT INTO ubicaciones (
    nombre,
    tipo,
    edificio
)
VALUES
    ('Laboratorio de Computacion 1', 'Laboratorio', 'Edificio A'),
    ('Laboratorio de Computacion 2', 'Laboratorio', 'Edificio A'),
    ('Laboratorio de Redes', 'Laboratorio', 'Edificio B'),
    ('Biblioteca', 'Biblioteca', 'Edificio C'),
    ('Aula 101', 'Aula', 'Edificio A'),
    ('Aula 203', 'Aula', 'Edificio B'),
    ('Sala de Profesores', 'Oficina', 'Edificio C'),
    ('Laboratorio de Electronica', 'Laboratorio', 'Edificio B');


-- 4. ACTIVOS

INSERT INTO activos (
    id_ubicacion,
    nombre,
    tipo,
    codigo_inventario,
    estado_activo
)
VALUES
    (
        1,
        'Computadora Dell OptiPlex 1',
        'Computadora',
        'ACT-001',
        'Operativo'
    ),
    (
        1,
        'Computadora Dell OptiPlex 2',
        'Computadora',
        'ACT-002',
        'Operativo'
    ),
    (
        1,
        'Computadora Dell OptiPlex 3',
        'Computadora',
        'ACT-003',
        'Fuera de servicio'
    ),
    (
        2,
        'Computadora HP ProDesk 1',
        'Computadora',
        'ACT-004',
        'Operativo'
    ),
    (
        2,
        'Proyector Epson 1',
        'Proyector',
        'ACT-005',
        'Operativo'
    ),
    (
        3,
        'Switch Cisco 2960',
        'Switch',
        'ACT-006',
        'Operativo'
    ),
    (
        3,
        'Router Cisco',
        'Router',
        'ACT-007',
        'Operativo'
    ),
    (
        4,
        'Computadora Biblioteca 1',
        'Computadora',
        'ACT-008',
        'Operativo'
    ),
    (
        5,
        'Proyector Epson 2',
        'Proyector',
        'ACT-009',
        'Operativo'
    ),
    (
        6,
        'Computadora HP ProDesk 2',
        'Computadora',
        'ACT-010',
        'Operativo'
    ),
    (
        7,
        'Impresora HP LaserJet',
        'Impresora',
        'ACT-011',
        'Operativo'
    ),
    (
        8,
        'Osciloscopio Digital',
        'Equipo de laboratorio',
        'ACT-012',
        'Operativo'
    );


-- 5. ESTADOS DE INCIDENCIA

INSERT INTO estados_incidencia (
    nombre_estado,
    orden
)
VALUES
    ('Registrada', 1),
    ('Asignada', 2),
    ('En proceso', 3),
    ('Resuelta', 4);


-- 6. INCIDENCIAS
-- ============================================================
-- Se incluyen incidencias en los diferentes estados para
-- facilitar las pruebas de la aplicación.
-- ============================================================

INSERT INTO incidencias (
    codigo,
    titulo,
    descripcion,
    prioridad,
    id_activo,
    id_usuario_reporta,
    id_estado
)
VALUES
    (
        'INC-0001',
        'Computadora no enciende',
        'La computadora no responde al presionar el boton de encendido.',
        'Alta',
        3,
        6,
        1
    ),
    (
        'INC-0002',
        'Proyector sin imagen',
        'El proyector enciende pero no muestra señal de video.',
        'Media',
        5,
        7,
        2
    ),
    (
        'INC-0003',
        'Problemas de conexion de red',
        'El equipo no obtiene direccion IP y no tiene acceso a Internet.',
        'Alta',
        6,
        8,
        3
    ),
    (
        'INC-0004',
        'Computadora lenta',
        'El equipo presenta bajo rendimiento durante la ejecucion de aplicaciones.',
        'Media',
        1,
        6,
        4
    ),
    (
        'INC-0005',
        'Impresora no imprime',
        'La impresora recibe los documentos pero no inicia la impresion.',
        'Media',
        11,
        7,
        1
    ),
    (
        'INC-0006',
        'Router presenta fallas',
        'El router pierde conectividad de forma intermitente.',
        'Alta',
        7,
        8,
        2
    ),
    (
        'INC-0007',
        'Proyector con imagen distorsionada',
        'La imagen proyectada presenta distorsion y parpadeos.',
        'Baja',
        9,
        6,
        3
    ),
    (
        'INC-0008',
        'Computadora no inicia sistema',
        'El equipo enciende pero no logra iniciar correctamente el sistema operativo.',
        'Alta',
        10,
        7,
        4
    ),
    (
        'INC-0009',
        'Falla en equipo de laboratorio',
        'El osciloscopio presenta problemas al mostrar las mediciones.',
        'Media',
        12,
        8,
        1
    ),
    (
        'INC-0010',
        'Computadora presenta errores',
        'Se muestran mensajes de error durante el uso normal del equipo.',
        'Baja',
        2,
        6,
        2
    );


-- 7. ASIGNACIONES
-- ============================================================
-- Técnicos:
-- 3 = Andres Vera
-- 4 = Daniel Torres
-- 5 = Luis Paredes
--
-- Administradores:
-- 1 = Carlos Mendoza
-- 2 = Maria Gonzalez
-- ============================================================

INSERT INTO asignaciones (
    id_incidencia,
    id_tecnico,
    asignado_por
)
VALUES
    (2, 3, 1),
    (3, 4, 1),
    (4, 5, 2),
    (6, 3, 1),
    (7, 4, 2),
    (8, 5, 1),
    (10, 3, 2);


-- 8. HISTORIAL DE ESTADOS
-- ============================================================
-- Se registra la evolución de varias incidencias.
-- ============================================================

INSERT INTO historial_estados (
    id_incidencia,
    id_estado,
    id_usuario_cambio,
    comentario
)
VALUES
    -- INC-0001
    (
        1,
        1,
        6,
        'Incidencia registrada por el usuario.'
    ),

    -- INC-0002
    (
        2,
        1,
        7,
        'Incidencia registrada.'
    ),
    (
        2,
        2,
        1,
        'Incidencia asignada al tecnico.'
    ),

    -- INC-0003
    (
        3,
        1,
        8,
        'Incidencia registrada.'
    ),
    (
        3,
        2,
        1,
        'Asignacion realizada.'
    ),
    (
        3,
        3,
        4,
        'Tecnico inicio la atencion.'
    ),

    -- INC-0004
    (
        4,
        1,
        6,
        'Incidencia registrada.'
    ),
    (
        4,
        2,
        2,
        'Asignada a tecnico.'
    ),
    (
        4,
        3,
        5,
        'Revision del equipo iniciada.'
    ),
    (
        4,
        4,
        5,
        'Equipo revisado y problema solucionado.'
    ),

    -- INC-0005
    (
        5,
        1,
        7,
        'Incidencia registrada.'
    ),

    -- INC-0006
    (
        6,
        1,
        8,
        'Incidencia registrada.'
    ),
    (
        6,
        2,
        1,
        'Asignacion realizada.'
    ),

    -- INC-0007
    (
        7,
        1,
        6,
        'Incidencia registrada.'
    ),
    (
        7,
        2,
        2,
        'Asignada a tecnico.'
    ),
    (
        7,
        3,
        4,
        'Revision del proyector iniciada.'
    ),

    -- INC-0008
    (
        8,
        1,
        7,
        'Incidencia registrada.'
    ),
    (
        8,
        2,
        1,
        'Asignacion realizada.'
    ),
    (
        8,
        3,
        5,
        'Diagnostico del sistema iniciado.'
    ),
    (
        8,
        4,
        5,
        'Sistema restaurado correctamente.'
    ),

    -- INC-0009
    (
        9,
        1,
        8,
        'Incidencia registrada.'
    ),

    -- INC-0010
    (
        10,
        1,
        6,
        'Incidencia registrada.'
    ),
    (
        10,
        2,
        2,
        'Asignada a tecnico.'
    );
    
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM ubicaciones;
SELECT COUNT(*) FROM activos;
SELECT COUNT(*) FROM estados_incidencia;
SELECT COUNT(*) FROM incidencias;
SELECT COUNT(*) FROM asignaciones;
SELECT COUNT(*) FROM historial_estados;