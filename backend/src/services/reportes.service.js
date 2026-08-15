import pool from '../config/mysql.js';

export async function porEstado() {
  const [rows] = await pool.execute(
    `SELECT
       e.id_estado,
       e.nombre_estado AS estado,
       e.orden,
       COUNT(i.id_incidencia) AS total
     FROM estados_incidencia e
     LEFT JOIN incidencias i ON i.id_estado = e.id_estado
     GROUP BY e.id_estado, e.nombre_estado, e.orden
     ORDER BY e.orden`
  );
  return rows;
}

export async function porTecnico() {
  const [rows] = await pool.execute(
    `SELECT
       id_tecnico,
       tecnico,
       total_incidencias,
       incidencias_activas,
       incidencias_resueltas,
       funcion_incidencias_activas
     FROM vw_resumen_por_tecnico
     ORDER BY tecnico`
  );
  return rows;
}
