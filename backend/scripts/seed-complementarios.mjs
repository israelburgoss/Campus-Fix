// Seed complementario — Fase 9 (autorizado por el usuario).
// Inserta SOLO las filas faltantes para cumplir AGENTS.md §30, sin modificar
// los scripts existentes. Reutiliza sp_asignar_tecnico para coherencia.
// Uso (backend corriendo o no, usa el pool de config):
//   node backend/scripts/seed-complementarios.mjs
import pool from '../src/config/mysql.js';
import bcrypt from 'bcryptjs';
import env from '../src/config/env.js';

const DEF = env.defaultPassword || 'CampusFix2026!';
const MIN = { usuarios: 10, activos: 15, incidencias: 30, asignaciones: 20 };

async function rolId(nombre) {
  const [r] = await pool.execute('SELECT id_rol FROM roles WHERE nombre_rol = ?', [nombre]);
  return r[0]?.id_rol;
}

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[u]] = await conn.execute('SELECT COUNT(*) c FROM usuarios');
    const [[a]] = await conn.execute('SELECT COUNT(*) c FROM activos');
    const [[i]] = await conn.execute('SELECT COUNT(*) c FROM incidencias');
    const [[s]] = await conn.execute('SELECT COUNT(*) c FROM asignaciones');
    const defU = Math.max(0, MIN.usuarios - u.c);
    const defA = Math.max(0, MIN.activos - a.c);
    const defI = Math.max(0, MIN.incidencias - i.c);
    const defS = Math.max(0, MIN.asignaciones - s.c);

    console.log(`Deficit -> usuarios:${defU} activos:${defA} incidencias:${defI} asignaciones:${defS}`);

    const hash = await bcrypt.hash(DEF, 10);
    const idRolUsuario = await rolId('Usuario');
    const idRolTecnico = await rolId('Tecnico');
    const [[adminRow]] = await conn.execute('SELECT id_usuario FROM usuarios WHERE correo = ?', ['carlos.mendoza@ecotec.edu.ec']);
    const adminId = adminRow?.id_usuario ?? 1;
    const [tecs] = await conn.execute('SELECT id_usuario FROM usuarios WHERE id_rol = ?', [idRolTecnico]);
    const tecIds = tecs.map(t => t.id_usuario);
    const [ubs] = await conn.execute('SELECT id_ubicacion FROM ubicaciones');
    const ubicIds = ubs.map(x => x.id_ubicacion);
    const [acts] = await conn.execute('SELECT id_activo FROM activos');
    const actIds = acts.map(x => x.id_activo);
    const [usrs] = await conn.execute('SELECT id_usuario FROM usuarios');
    const usrIds = usrs.map(x => x.id_usuario);

    // Usuarios nuevos
    const nuevosUsuarios = [
      { n: 'Lucia', a: 'Fernandez', c: 'lucia.fernandez@ecotec.edu.ec', rol: idRolUsuario },
      { n: 'Miguel', a: 'Castro', c: 'miguel.castro@ecotec.edu.ec', rol: idRolTecnico },
    ];
    let k = 0;
    for (let n = 0; n < defU; n++) {
      const u0 = nuevosUsuarios[k % nuevosUsuarios.length]; k++;
      const correo = defU > nuevosUsuarios.length
        ? `extra${n + 1}.usuario@ecotec.edu.ec`
        : u0.c;
      await conn.execute(
        'INSERT INTO usuarios (id_rol, nombres, apellidos, correo, contrasena_hash, activo, fecha_registro) VALUES (?, ?, ?, ?, ?, 1, NOW())',
        [u0.rol, u0.n, u0.a, correo, hash]
      );
    }

    // Activos nuevos
    for (let n = 0; n < defA; n++) {
      const ub = ubicIds[n % ubicIds.length];
      await conn.execute(
        'INSERT INTO activos (id_ubicacion, nombre, tipo, codigo_inventario, estado_activo) VALUES (?, ?, ?, ?, ?)',
        [ub, `Activo complementario ${n + 1}`, 'Generico', `INV-COMP-${n + 1}`, 'Operativo']
      );
    }

    // Incidencias nuevas (estado Registrada; el trigger genera el código)
    const [[estadoReg]] = [await conn.execute("SELECT id_estado FROM estados_incidencia WHERE nombre_estado = 'Registrada'")];
    const nuevoActIds = (await conn.execute('SELECT id_activo FROM activos'))[0].map(x => x.id_activo);
    const nuevoUsrIds = (await conn.execute('SELECT id_usuario FROM usuarios'))[0].map(x => x.id_usuario);
    const prioridades = ['Baja', 'Media', 'Alta'];
    const nuevasInc = [];
    for (let n = 0; n < defI; n++) {
      const act = nuevoActIds[n % nuevoActIds.length];
      const rep = nuevoUsrIds[n % nuevoUsrIds.length];
      const pri = prioridades[n % 3];
      const [res] = await conn.execute(
        `INSERT INTO incidencias (codigo, titulo, descripcion, prioridad, id_activo, id_usuario_reporta, id_estado, fecha_registro, fecha_actualizacion)
         VALUES (NULL, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [`Incidencia complementaria ${n + 1}`, `Descripción de la incidencia complementaria ${n + 1}`, pri, act, rep, estadoReg[0].id_estado]
      );
      nuevasInc.push(res.insertId);
    }

    // Asignaciones nuevas (insert directo + UPDATE estado con vars de sesión)
    const [[estadoAsig]] = await conn.execute("SELECT id_estado FROM estados_incidencia WHERE nombre_estado = 'Asignada'");
    const objetivo = Math.min(defS, nuevasInc.length);
    await conn.query('SET @campusfix_usuario_cambio = ?', [adminId]);
    await conn.query("SET @campusfix_comentario = 'Asignación masiva Fase 9'");
    for (let n = 0; n < objetivo; n++) {
      const inc = nuevasInc[n];
      const tec = tecIds[n % tecIds.length];
      await conn.execute(
        'INSERT INTO asignaciones (id_incidencia, id_tecnico, asignado_por, fecha_asignacion) VALUES (?, ?, ?, NOW())',
        [inc, tec, adminId]
      );
      await conn.execute(
        'UPDATE incidencias SET id_estado = ?, fecha_actualizacion = NOW() WHERE id_incidencia = ?',
        [estadoAsig[0].id_estado, inc]
      );
    }
    console.log(`Insertadas ${objetivo} asignaciones coherentes.`);

    await conn.commit();
    console.log('Seed complementario aplicado.');
  } catch (e) {
    await conn.rollback();
    console.error('Error en seed:', e.message);
    process.exit(1);
  } finally {
    conn.release();
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
