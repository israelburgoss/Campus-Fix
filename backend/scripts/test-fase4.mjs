import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://localhost:3000';
const ADMIN = { correo: 'carlos.mendoza@ecotec.edu.ec', contrasena: 'CampusFix2026!' };
const TEC = { correo: 'andres.vera@ecotec.edu.ec', contrasena: 'CampusFix2026!' };
const USR = { correo: 'juan.perez@ecotec.edu.ec', contrasena: 'CampusFix2026!' };

let pass = 0;
let fail = 0;
const fails = [];

function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    fails.push(name);
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no json */
  }
  return { status: res.status, data };
}

async function login(creds) {
  const { status, data } = await req('POST', '/api/auth/login', { body: creds });
  if (status !== 200 || !data?.token) throw new Error(`login falló: ${status} ${JSON.stringify(data)}`);
  return data.token;
}

async function cleanup(id) {
  const pool = (await import('../src/config/mysql.js')).default;
  const { connectMongo } = await import('../src/config/mongodb.js');
  const conn = await pool.getConnection();
  try {
    await conn.query('SET @campusfix_usuario_cambio = 1');
    await conn.query("SET @campusfix_comentario = 'cleanup test'");
    await conn.execute(
      'UPDATE incidencias SET id_estado = (SELECT id_estado FROM estados_incidencia WHERE nombre_estado = "En proceso") WHERE id_incidencia = ?',
      [id]
    );
    await conn.execute('DELETE FROM historial_estados WHERE id_incidencia = ?', [id]);
    await conn.execute('DELETE FROM asignaciones WHERE id_incidencia = ?', [id]);
    await conn.execute('DELETE FROM incidencias WHERE id_incidencia = ?', [id]);
  } finally {
    conn.release();
  }
  const db = await connectMongo();
  await db.collection('diagnosticos').deleteMany({ incidenciaId: id });
  await db.collection('evidencias').deleteMany({ incidenciaId: id });
}

async function limpiarMongo(id) {
  const { connectMongo } = await import('../src/config/mongodb.js');
  const db = await connectMongo();
  await db.collection('diagnosticos').deleteMany({ incidenciaId: id });
  await db.collection('evidencias').deleteMany({ incidenciaId: id });
}

async function main() {
  const aTok = await login(ADMIN);
  const tTok = await login(TEC);
  const uTok = await login(USR);

  // 1. Registrar incidencia como usuario
  const reg = await req('POST', '/api/incidencias', {
    token: uTok,
    body: { titulo: 'Test F4', descripcion: 'Incidencia de prueba fase 4', prioridad: 'Media' },
  });
  check('registrar incidencia (201)', reg.status === 201, JSON.stringify(reg.data));
  const id = reg.data?.id_incidencia;
  check('id generado', Number.isInteger(id) && id > 0, `id=${id}`);

  // Defensa: los datos semilla de MongoDB ya traen diagnosticos/evidencias para
  // incidenciaId 1..20, lo que contamina el id de prueba. Limpiamos para aislar.
  await limpiarMongo(id);

  // 2. Detalle integrado (sin Mongo aun)
  const det0 = await req('GET', `/api/incidencias/${id}`, { token: aTok });
  check('detalle 200', det0.status === 200, JSON.stringify(det0.data));
  check('detalle: diagnosticos vacio', Array.isArray(det0.data?.incidencia?.diagnosticos) && det0.data.incidencia.diagnosticos.length === 0);
  check('detalle: evidencias vacio', Array.isArray(det0.data?.incidencia?.evidencias) && det0.data.incidencia.evidencias.length === 0);
  check('detalle: estado Registrada', det0.data?.incidencia?.estado === 'Registrada', det0.data?.incidencia?.estado);
  check('detalle: reportante presente', !!det0.data?.incidencia?.reportante);

  // 3. Asignar como usuario (no admin) -> 403
  const asigUsr = await req('PUT', `/api/incidencias/${id}/asignar`, { token: uTok, body: { id_tecnico: 3 } });
  check('asignar rol Usuario -> 403', asigUsr.status === 403, `status=${asigUsr.status}`);

  // 4. Asignar como admin -> 200
  const asig = await req('PUT', `/api/incidencias/${id}/asignar`, { token: aTok, body: { id_tecnico: 3 } });
  check('asignar admin -> 200', asig.status === 200, JSON.stringify(asig.data));

  // 5. Cambiar a En proceso como tecnico asignado -> 200
  const ep = await req('PUT', `/api/incidencias/${id}/estado`, { token: tTok, body: { estado: 'En proceso' } });
  check('estado -> En proceso (tecnico) 200', ep.status === 200, JSON.stringify(ep.data));

  // 6. Resuelta sin diagnostico -> 400 (RN-05)
  const resNoDiag = await req('PUT', `/api/incidencias/${id}/estado`, { token: tTok, body: { estado: 'Resuelta' } });
  check('Resuelta sin diagnostico -> 400 (RN-05)', resNoDiag.status === 400, `status=${resNoDiag.status}`);

  // 7. Diagnostico como usuario no asignado -> 403
  const diagUsr = await req('POST', `/api/incidencias/${id}/diagnosticos`, {
    token: uTok,
    body: { descripcion: 'diag' },
  });
  check('diagnostico rol Usuario -> 403', diagUsr.status === 403, `status=${diagUsr.status}`);

  // 8. Diagnostico como tecnico asignado -> 201
  const diag = await req('POST', `/api/incidencias/${id}/diagnosticos`, {
    token: tTok,
    body: {
      descripcion: 'Falla de fuente',
      pruebasRealizadas: ['Cambio de cable', 'Medicion voltaje'],
      causaProbable: 'Fuente quemada',
      solucionAplicada: 'Reemplazo de fuente',
    },
  });
  check('diagnostico tecnico -> 201', diag.status === 201, JSON.stringify(diag.data));

  // 9. Ahora Resuelta -> 200
  const resOk = await req('PUT', `/api/incidencias/${id}/estado`, { token: tTok, body: { estado: 'Resuelta', comentario: 'Resuelto' } });
  check('Resuelta con diagnostico -> 200', resOk.status === 200, JSON.stringify(resOk.data));

  // 10. Detalle con diagnostico e historial
  const det1 = await req('GET', `/api/incidencias/${id}`, { token: aTok });
  check('detalle: estado Resuelta', det1.data?.incidencia?.estado === 'Resuelta', det1.data?.incidencia?.estado);
  check('detalle: diagnostico presente', det1.data?.incidencia?.diagnosticos?.length >= 1);
  check('detalle: historial >= 3', (det1.data?.incidencia?.historial?.length ?? 0) >= 3, `hist=${det1.data?.incidencia?.historial?.length}`);

  // 11. Evidencia como tecnico -> 201
  const ev = await req('POST', `/api/incidencias/${id}/evidencias`, {
    token: tTok,
    body: { tipo: 'imagen', url: 'https://x.local/e.jpg', nombre: 'ev1.jpg' },
  });
  check('evidencia tecnico -> 201', ev.status === 201, JSON.stringify(ev.data));

  // 12. Evidencia tipo invalido -> 400
  const evBad = await req('POST', `/api/incidencias/${id}/evidencias`, {
    token: tTok,
    body: { tipo: 'audio', url: 'https://x.local/e.mp3' },
  });
  check('evidencia tipo invalido -> 400', evBad.status === 400, `status=${evBad.status}`);

  // 13. Estado invalido -> 400
  const stBad = await req('PUT', `/api/incidencias/${id}/estado`, { token: tTok, body: { estado: 'Cancelada' } });
  check('estado invalido -> 400', stBad.status === 400, `status=${stBad.status}`);

  // 14. id invalido (no numerico) -> 400
  const badId = await req('GET', '/api/incidencias/abc', { token: aTok });
  check('id no numerico -> 400', badId.status === 400, `status=${badId.status}`);

  // 15. id inexistente -> 404
  const noId = await req('GET', '/api/incidencias/9999999', { token: aTok });
  check('id inexistente -> 404', noId.status === 404, `status=${noId.status}`);

  // 16. Sin token -> 401
  const noTok = await req('GET', `/api/incidencias/${id}`, {});
  check('sin token -> 401', noTok.status === 401, `status=${noTok.status}`);

  // Limpieza
  try {
    await cleanup(id);
    console.log(`  (limpieza) incidencia ${id} eliminada`);
  } catch (e) {
    console.log(`  (limpieza) advertencia: ${e.message}`);
    console.log(e.stack);
  }

  console.log(`\nResultado Fase 4: ${pass} PASS / ${fail} FAIL`);
  if (fail) {
    console.log('Fallos:', fails.join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Error en pruebas:', e);
  process.exit(1);
});
