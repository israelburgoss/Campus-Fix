import pool from '../config/mysql.js';
import { connectMongo } from '../config/mongodb.js';

async function generarCodigo() {
  const [rows] = await pool.execute(
    `SELECT CONCAT(
       'INC-',
       YEAR(CURRENT_DATE),
       '-',
       LPAD(COALESCE(MAX(id_incidencia), 0) + 1, 4, '0')
     ) AS codigo
     FROM incidencias`
  );
  return rows[0].codigo;
}

function normalizarError(err, { notFound = false } = {}) {
  const mensaje = err.sqlMessage || err.message || 'Error en la base de datos';
  const error = new Error(mensaje);
  if (err.code === 'ER_DUP_ENTRY') {
    error.status = 409;
  } else if (notFound && /no existe/i.test(mensaje)) {
    error.status = 404;
  } else {
    error.status = 400;
  }
  return error;
}

function idInvalidoError() {
  const error = new Error('ID de incidencia inválido');
  error.status = 400;
  return error;
}

async function validarIncidenciaExiste(id) {
  const [rows] = await pool.execute(
    'SELECT id_incidencia FROM incidencias WHERE id_incidencia = ?',
    [id]
  );
  if (!rows[0]) {
    const error = new Error('La incidencia no existe');
    error.status = 404;
    throw error;
  }
}

export async function registrar({ titulo, descripcion, prioridad, id_activo, id_usuario_reporta }) {
  const codigo = await generarCodigo();

  try {
    const [results] = await pool.execute(
      'CALL sp_registrar_incidencia(?, ?, ?, ?, ?, ?)',
      [codigo, titulo, descripcion, prioridad, id_activo ?? null, id_usuario_reporta]
    );

    const fila = results
      .flat()
      .find((r) => r && typeof r === 'object' && r.id_incidencia !== undefined);

    return {
      id_incidencia: fila?.id_incidencia ?? null,
      codigo: fila?.codigo || codigo,
    };
  } catch (err) {
    throw normalizarError(err);
  }
}

export async function listar({ estado, prioridad } = {}) {
  const condiciones = [];
  const params = [];

  if (estado) {
    condiciones.push('e.nombre_estado = ?');
    params.push(estado);
  }
  if (prioridad) {
    condiciones.push('i.prioridad = ?');
    params.push(prioridad);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT
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
       fn_dias_transcurridos(i.id_incidencia) AS dias_transcurridos,
       (SELECT CONCAT(te.nombres, ' ', te.apellidos)
          FROM asignaciones asg
          INNER JOIN usuarios te ON te.id_usuario = asg.id_tecnico
         WHERE asg.id_incidencia = i.id_incidencia
         ORDER BY asg.id_asignacion DESC
         LIMIT 1) AS tecnico
     FROM incidencias i
     INNER JOIN estados_incidencia e ON e.id_estado = i.id_estado
     INNER JOIN usuarios u ON u.id_usuario = i.id_usuario_reporta
     LEFT JOIN activos a ON a.id_activo = i.id_activo
     LEFT JOIN ubicaciones ub ON ub.id_ubicacion = a.id_ubicacion
     ${where}
     ORDER BY i.fecha_registro DESC`,
    params
  );

  return rows;
}

export async function detalle(id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw idInvalidoError();
  }

  const [rows] = await pool.execute(
    `SELECT
       i.id_incidencia,
       i.codigo,
       i.titulo,
       i.descripcion,
       i.prioridad,
       e.nombre_estado AS estado,
       i.fecha_registro,
       i.fecha_actualizacion,
       u.id_usuario AS id_reportante,
       CONCAT(u.nombres, ' ', u.apellidos) AS reportante,
       a.id_activo,
       a.nombre AS activo,
       a.codigo_inventario,
       a.estado_activo,
       ub.id_ubicacion,
       ub.nombre AS ubicacion,
       ub.tipo AS tipo_ubicacion,
       ub.edificio,
       (SELECT te.id_usuario
          FROM asignaciones asg
          INNER JOIN usuarios te ON te.id_usuario = asg.id_tecnico
         WHERE asg.id_incidencia = i.id_incidencia
         ORDER BY asg.id_asignacion DESC
         LIMIT 1) AS id_tecnico,
       (SELECT CONCAT(te.nombres, ' ', te.apellidos)
          FROM asignaciones asg
          INNER JOIN usuarios te ON te.id_usuario = asg.id_tecnico
         WHERE asg.id_incidencia = i.id_incidencia
         ORDER BY asg.id_asignacion DESC
         LIMIT 1) AS tecnico
     FROM incidencias i
     INNER JOIN estados_incidencia e ON e.id_estado = i.id_estado
     INNER JOIN usuarios u ON u.id_usuario = i.id_usuario_reporta
     LEFT JOIN activos a ON a.id_activo = i.id_activo
     LEFT JOIN ubicaciones ub ON ub.id_ubicacion = a.id_ubicacion
     WHERE i.id_incidencia = ?`,
    [id]
  );

  const incidencia = rows[0];
  if (!incidencia) {
    const error = new Error('La incidencia no existe');
    error.status = 404;
    throw error;
  }

  const [historial] = await pool.execute(
    `SELECT
       h.id_historial,
       e.nombre_estado AS estado,
       CONCAT(u.nombres, ' ', u.apellidos) AS usuario,
       h.fecha_cambio,
       h.comentario
     FROM historial_estados h
     INNER JOIN estados_incidencia e ON e.id_estado = h.id_estado
     INNER JOIN usuarios u ON u.id_usuario = h.id_usuario_cambio
     WHERE h.id_incidencia = ?
     ORDER BY h.fecha_cambio ASC`,
    [id]
  );

  const db = await connectMongo();
  const diagnosticos = await db
    .collection('diagnosticos')
    .find({ incidenciaId: id })
    .sort({ fecha: -1 })
    .toArray();
  const evidencias = await db
    .collection('evidencias')
    .find({ incidenciaId: id })
    .sort({ fecha: -1 })
    .toArray();

  return { ...incidencia, historial, diagnosticos, evidencias };
}

export async function asignar(id, idTecnico, asignadoPor) {
  if (!Number.isInteger(id) || id <= 0) {
    throw idInvalidoError();
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('SET @campusfix_usuario_cambio = ?', [asignadoPor]);
      await conn.query("SET @campusfix_comentario = 'Incidencia asignada a tecnico'");
      const [results] = await conn.execute(
        'CALL sp_asignar_tecnico(?, ?, ?)',
        [id, idTecnico, asignadoPor]
      );
      const fila = results
        .flat()
        .find((r) => r && typeof r === 'object' && r.id_incidencia !== undefined);
      return {
        id_incidencia: fila?.id_incidencia ?? id,
        id_tecnico: fila?.id_tecnico ?? idTecnico,
      };
    } finally {
      conn.release();
    }
  } catch (err) {
    throw normalizarError(err, { notFound: true });
  }
}

export async function cambiarEstado(id, estadoNuevo, comentario, usuario) {
  if (!Number.isInteger(id) || id <= 0) {
    throw idInvalidoError();
  }

  const [estadoRows] = await pool.execute(
    'SELECT id_estado FROM estados_incidencia WHERE nombre_estado = ?',
    [estadoNuevo]
  );
  if (!estadoRows[0]) {
    const error = new Error('El estado indicado no existe');
    error.status = 400;
    throw error;
  }
  const idEstadoNuevo = estadoRows[0].id_estado;

  if (['En proceso', 'Resuelta'].includes(estadoNuevo) && usuario.rol !== 'Administrador') {
    const [asig] = await pool.execute(
      'SELECT COUNT(*) AS n FROM asignaciones WHERE id_incidencia = ? AND id_tecnico = ?',
      [id, usuario.id_usuario]
    );
    if (asig[0].n === 0) {
      const error = new Error('Solo el técnico asignado puede cambiar a este estado');
      error.status = 403;
      throw error;
    }
  }

  if (estadoNuevo === 'Resuelta') {
    const db = await connectMongo();
    const existe = await db
      .collection('diagnosticos')
      .countDocuments({ incidenciaId: id });
    if (existe === 0) {
      const error = new Error('No se puede pasar a Resuelta sin un diagnóstico registrado');
      error.status = 400;
      throw error;
    }
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('SET @campusfix_usuario_cambio = ?', [usuario.id_usuario]);
      await conn.query('SET @campusfix_comentario = ?', [comentario ?? null]);
      const [results] = await conn.execute(
        'CALL sp_cambiar_estado(?, ?, ?, ?)',
        [id, idEstadoNuevo, usuario.id_usuario, comentario ?? null]
      );
      const fila = results
        .flat()
        .find((r) => r && typeof r === 'object' && r.id_incidencia !== undefined);
      return {
        id_incidencia: fila?.id_incidencia ?? id,
        nuevo_estado: fila?.nuevo_estado || estadoNuevo,
      };
    } finally {
      conn.release();
    }
  } catch (err) {
    throw normalizarError(err, { notFound: true });
  }
}

export async function registrarDiagnostico(id, tecnicoId, data) {
  if (!Number.isInteger(id) || id <= 0) {
    throw idInvalidoError();
  }

  await validarIncidenciaExiste(id);

  const [asig] = await pool.execute(
    'SELECT COUNT(*) AS n FROM asignaciones WHERE id_incidencia = ? AND id_tecnico = ?',
    [id, tecnicoId]
  );
  if (asig[0].n === 0) {
    const error = new Error('Solo el técnico asignado puede registrar el diagnóstico');
    error.status = 403;
    throw error;
  }

  const db = await connectMongo();
  const doc = {
    incidenciaId: id,
    tecnicoId,
    descripcion: data.descripcion,
    fecha: new Date(),
  };
  if (data.pruebasRealizadas?.length) doc.pruebasRealizadas = data.pruebasRealizadas;
  if (data.causaProbable) doc.causaProbable = data.causaProbable;
  if (data.solucionAplicada) doc.solucionAplicada = data.solucionAplicada;

  const result = await db.collection('diagnosticos').insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

export async function registrarEvidencia(id, data) {
  if (!Number.isInteger(id) || id <= 0) {
    throw idInvalidoError();
  }

  await validarIncidenciaExiste(id);

  const db = await connectMongo();
  const doc = {
    incidenciaId: id,
    tipo: data.tipo,
    url: data.url,
    fecha: new Date(),
  };
  if (data.nombre) doc.nombre = data.nombre;
  if (data.descripcion) doc.descripcion = data.descripcion;

  const result = await db.collection('evidencias').insertOne(doc);
  return { _id: result.insertedId, ...doc };
}