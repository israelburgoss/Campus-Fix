// QA integral — Fase 9: verifica RNs y criterios de aceptación (AGENTS.md §33-§35)
// Uso: arrancar el backend (pnpm --filter backend dev) y luego:
//   node backend/scripts/test-fase9.mjs
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

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
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function login(creds) {
  const { status, data } = await req('POST', '/api/auth/login', { body: creds });
  if (status !== 200 || !data?.token) throw new Error(`login falló (${status}): ${JSON.stringify(data)}`);
  return data;
}

async function detail(id, token) {
  const { status, data } = await req('GET', `/api/incidencias/${id}`, { token });
  return { status, data };
}

// ─── Limpieza de incidencias de prueba ───────────────────────────────────────
async function cleanup(ids) {
  if (!ids.length) return;
  const pool = (await import('../src/config/mysql.js')).default;
  const { connectMongo } = await import('../src/config/mongodb.js');
  const db = await connectMongo();
  const admin = await (async () => {
    const [r] = await pool.execute('SELECT id_usuario FROM usuarios WHERE correo = ?', [ADMIN.correo]);
    return r[0]?.id_usuario ?? 1;
  })();
  const conn = await pool.getConnection();
  try {
    await conn.query('SET @campusfix_usuario_cambio = ?', [admin]);
    await conn.query("SET @campusfix_comentario = 'cleanup fase9'");
    for (const id of ids) {
      await db.collection('diagnosticos').deleteMany({ incidenciaId: id });
      await db.collection('evidencias').deleteMany({ incidenciaId: id });
      await conn.execute(
        'UPDATE incidencias SET id_estado = (SELECT id_estado FROM estados_incidencia WHERE nombre_estado = "En proceso") WHERE id_incidencia = ?',
        [id]
      );
      await conn.execute('DELETE FROM historial_estados WHERE id_incidencia = ?', [id]);
      await conn.execute('DELETE FROM asignaciones WHERE id_incidencia = ?', [id]);
      await conn.execute('DELETE FROM incidencias WHERE id_incidencia = ?', [id]);
    }
  } finally {
    conn.release();
  }
}

// ─── Verificación de datos mínimos (solo lectura) ─────────────────────────────
async function verificarMinimos() {
  const pool = (await import('../src/config/mysql.js')).default;
  const { connectMongo } = await import('../src/config/mongodb.js');
  const db = await connectMongo();
  const min = {
    roles: [3, 'roles'], usuarios: [10, 'usuarios'], tecnicos: [3, 'usuarios rol Tecnico'],
    ubicaciones: [5, 'ubicaciones'], activos: [15, 'activos'], incidencias: [30, 'incidencias'],
    asignaciones: [20, 'asignaciones'], historial: [40, 'historial_estados'],
  };
  const counts = {};
  const [[rRoles]] = [await pool.execute('SELECT COUNT(*) c FROM roles')];
  const [[rUsr]] = [await pool.execute('SELECT COUNT(*) c FROM usuarios')];
  const [[rTec]] = [await pool.execute("SELECT COUNT(*) c FROM usuarios WHERE id_rol = (SELECT id_rol FROM roles WHERE nombre_rol = 'Tecnico')")];
  const [[rUbi]] = [await pool.execute('SELECT COUNT(*) c FROM ubicaciones')];
  const [[rAct]] = [await pool.execute('SELECT COUNT(*) c FROM activos')];
  const [[rInc]] = [await pool.execute('SELECT COUNT(*) c FROM incidencias')];
  const [[rAsg]] = [await pool.execute('SELECT COUNT(*) c FROM asignaciones')];
  const [[rHis]] = [await pool.execute('SELECT COUNT(*) c FROM historial_estados')];
  counts.roles = rRoles[0].c; counts.usuarios = rUsr[0].c; counts.tecnicos = rTec[0].c;
  counts.ubicaciones = rUbi[0].c; counts.activos = rAct[0].c; counts.incidencias = rInc[0].c;
  counts.asignaciones = rAsg[0].c; counts.historial = rHis[0].c;
  const mDiag = await db.collection('diagnosticos').estimatedDocumentCount();
  const mEvid = await db.collection('evidencias').estimatedDocumentCount();
  counts.diagnosticos = mDiag; counts.evidencias = mEvid;

  console.log('\n== Datos de prueba (mínimos AGENTS.md §30) ==');
  check(`roles >= 3 (${counts.roles})`, counts.roles >= 3);
  check(`usuarios >= 10 (${counts.usuarios})`, counts.usuarios >= 10);
  check(`técnicos (rol Tecnico) >= 3 (${counts.tecnicos})`, counts.tecnicos >= 3);
  check(`ubicaciones >= 5 (${counts.ubicaciones})`, counts.ubicaciones >= 5);
  check(`activos >= 15 (${counts.activos})`, counts.activos >= 15);
  check(`incidencias >= 30 (${counts.incidencias})`, counts.incidencias >= 30);
  check(`asignaciones >= 20 (${counts.asignaciones})`, counts.asignaciones >= 20);
  check(`historial >= 40 (${counts.historial})`, counts.historial >= 40);
  check(`diagnósticos Mongo >= 20 (${counts.diagnosticos})`, counts.diagnosticos >= 20);
  check(`evidencias Mongo >= 20 (${counts.evidencias})`, counts.evidencias >= 20);
}

// ─── Flujo principal ──────────────────────────────────────────────────────────
async function main() {
  const created = [];
  try {
    console.log('\n== Autenticación y seguridad ==');
    const admin = await login(ADMIN);
    const tec = await login(TEC);
    const usr = await login(USR);
    check('Login admin (200 + token)', !!admin.token);
    check('Login técnico (200 + token)', !!tec.token);
    check('Login usuario (200 + token)', !!usr.token);

    // contraseña incorrecta
    const bad = await req('POST', '/api/auth/login', { body: { correo: ADMIN.correo, contrasena: 'wrong' } });
    check('RN-01/seguridad: contraseña incorrecta -> 401', bad.status === 401 && bad.data?.success === false);

    // sin token
    const noTok = await req('GET', '/api/auth/me');
    check('JWT requerido: /me sin token -> 401', noTok.status === 401 && noTok.data?.success === false);

    // con token
    const me = await req('GET', '/api/auth/me', { token: admin.token });
    check('/me con token devuelve usuario + rol', me.status === 200 && me.data?.usuario?.rol === 'Administrador');

    // usuario inactivo no loguea (si existe alguno)
    const pool = (await import('../src/config/mysql.js')).default;
    const [[inact]] = [await pool.execute('SELECT correo FROM usuarios WHERE activo = 0 LIMIT 1')];
    if (inact[0]) {
      const r = await req('POST', '/api/auth/login', { body: { correo: inact[0].correo, contrasena: process.env.DEFAULT_PASSWORD || 'CampusFix2026!' } });
      check('RN-01: usuario inactivo no inicia sesión -> 401', r.status === 401);
    } else {
      console.log('  (sin usuarios inactivos en datos de prueba; RN-01 cubierta por validación en login)');
    }

    console.log('\n== Registro de incidencia (RN-02, RN-03) ==');
    const reg = await req('POST', '/api/incidencias', { token: usr.token, body: { titulo: 'QA Fase9 incidencia', descripcion: 'Creada por el script de QA', prioridad: 'Alta' } });
    check('Registrar incidencia -> 201', reg.status === 201 && reg.data?.success === true);
    const N = reg.data?.id_incidencia;
    created.push(N);
    check('RN-02: código único generado (INC-AAAA-NNNN)', /^INC-\d{4}-\d{4}$/.test(reg.data?.codigo || ''));
    await sleep(150);
    const d1 = await detail(N, admin.token);
    check('RN-03: nueva incidencia inicia en "Registrada"', d1.data?.incidencia?.estado === 'Registrada');
    check('Detalle integrado: historial es array', Array.isArray(d1.data?.incidencia?.historial));
    check('Detalle integrado: diagnosticos es array (Mongo OK)', Array.isArray(d1.data?.incidencia?.diagnosticos));
    check('Detalle integrado: evidencias es array (Mongo OK)', Array.isArray(d1.data?.incidencia?.evidencias));

    console.log('\n== Listar y detalle ==');
    const list = await req('GET', '/api/incidencias', { token: admin.token });
    check('Listar incidencias -> array no vacío', list.status === 200 && Array.isArray(list.data?.incidencias) && list.data.incidencias.length > 0);
    const det = await detail(N, admin.token);
    check('Detalle por id funciona', det.status === 200 && det.data?.incidencia?.id_incidencia === N);

    console.log('\n== Asignación (roles + RN técnico) ==');
    // usuario (no admin) no puede asignar
    const asgUsr = await req('PUT', `/api/incidencias/${N}/asignar`, { token: usr.token, body: { id_tecnico: tec.usuario.id_usuario } });
    check('Solo Administrador asigna -> usuario 403', asgUsr.status === 403);
    // asignar un NO técnico (usuario) debe fallar
    const asgNoTec = await req('PUT', `/api/incidencias/${N}/asignar`, { token: admin.token, body: { id_tecnico: usr.usuario.id_usuario } });
    check('Técnico debe tener rol Tecnico -> asignar usuario falla (400/409)', asgNoTec.status === 400 || asgNoTec.status === 409);
    // asignar técnico válido
    const asgOk = await req('PUT', `/api/incidencias/${N}/asignar`, { token: admin.token, body: { id_tecnico: tec.usuario.id_usuario } });
    check('Admin asigna técnico válido -> 200', asgOk.status === 200 && asgOk.data?.success === true);
    await sleep(150);
    const dAsg = await detail(N, admin.token);
    check('Tras asignar, estado = "Asignada"', dAsg.data?.incidencia?.estado === 'Asignada');
    check('Tras asignar, técnico presente', !!dAsg.data?.incidencia?.tecnico);

    console.log('\n== Cambio de estado (RN-04, RN-05) ==');
    // RN-04: En proceso ya tiene técnico (asignado arriba) -> debe permitir
    const ep = await req('PUT', `/api/incidencias/${N}/estado`, { token: admin.token, body: { estado: 'En proceso' } });
    check('RN-04: En proceso con técnico asignado -> 200', ep.status === 200);
    await sleep(150);
    const dEp = await detail(N, admin.token);
    check('Estado = "En proceso"', dEp.data?.incidencia?.estado === 'En proceso');
    check('RN-06: historial conserva cambios de estado (>=1)', (dEp.data?.incidencia?.historial?.length ?? 0) >= 1);

    // RN-05: Resuelta sin diagnóstico -> 400
    const resSinDiag = await req('PUT', `/api/incidencias/${N}/estado`, { token: admin.token, body: { estado: 'Resuelta' } });
    check('RN-05: Resuelta sin diagnóstico -> 400', resSinDiag.status === 400 && /diagn[aó]stico/i.test(resSinDiag.data?.message || ''));

    // Registrar diagnóstico (como técnico asignado)
    const diag = await req('POST', `/api/incidencias/${N}/diagnosticos`, { token: tec.token, body: { descripcion: 'QA diagnóstico', solucionAplicada: 'QA solución' } });
    check('Registrar diagnóstico (Mongo) -> 201', diag.status === 201 && diag.data?.success === true);
    await sleep(150);
    const dDiag = await detail(N, admin.token);
    check('Diagnóstico aparece en detalle integrado', (dDiag.data?.incidencia?.diagnosticos?.length ?? 0) >= 1);

    // Ahora Resuelta con diagnóstico -> 200
    const resOk = await req('PUT', `/api/incidencias/${N}/estado`, { token: admin.token, body: { estado: 'Resuelta' } });
    check('RN-05: Resuelta con diagnóstico -> 200', resOk.status === 200);
    await sleep(150);
    const dRes = await detail(N, admin.token);
    check('Estado final = "Resuelta"', dRes.data?.incidencia?.estado === 'Resuelta');

    console.log('\n== Evidencias (Mongo) ==');
    const ev = await req('POST', `/api/incidencias/${N}/evidencias`, { token: tec.token, body: { tipo: 'imagen', url: 'https://ejemplo.local/qa.jpg', nombre: 'qa.jpg' } });
    check('Registrar evidencia (Mongo) -> 201', ev.status === 201 && ev.data?.success === true);
    const evTipo = await req('POST', `/api/incidencias/${N}/evidencias`, { token: tec.token, body: { tipo: 'audio', url: 'https://ejemplo.local/x' } });
    check('Evidencia tipo inválido -> 400', evTipo.status === 400);
    const dEv = await detail(N, admin.token);
    check('Evidencia aparece en detalle integrado', (dEv.data?.incidencia?.evidencias?.length ?? 0) >= 1);

    console.log('\n== Reportes ==');
    const repEst = await req('GET', '/api/reportes/estados', { token: admin.token });
    const estados = repEst.data?.datos || [];
    const totalEst = estados.reduce((s, e) => s + (e.total ?? e.cantidad ?? 0), 0);
    const [[rTot]] = [await pool.execute('SELECT COUNT(*) c FROM incidencias')];
    check('Reporte por estado: 4 estados presentes', estados.length === 4);
    check('Reporte por estado: suma coherente con COUNT(*)', totalEst === rTot[0].c);

    const repTec = await req('GET', '/api/reportes/tecnicos', { token: admin.token });
    const tecRows = repTec.data?.datos || [];
    check('Reporte por técnico: usa vista (campos completos)', tecRows.length > 0 && 'incidencias_activas' in (tecRows[0] || {}));

    console.log('\n== Uniformidad de errores ==');
    const e1 = await req('GET', '/api/incidencias/999999', { token: admin.token });
    check('Error 404 tiene {success:false, message}', e1.status === 404 && e1.data?.success === false && typeof e1.data?.message === 'string');
    const e2 = await req('POST', '/api/incidencias', { token: usr.token, body: { titulo: '', descripcion: '' } });
    check('Validación 400 tiene {success:false, message}', e2.status === 400 && e2.data?.success === false);

    console.log('\n== RN-07: incidencia Resuelta no eliminable ==');
    const [[resId]] = [await pool.execute(
      `SELECT i.id_incidencia FROM incidencias i
       JOIN estados_incidencia e ON e.id_estado = i.id_estado
       WHERE e.nombre_estado = 'Resuelta' LIMIT 1`
    )];
    if (resId[0]) {
      const conn = await pool.getConnection();
      let bloqueado = false;
      try {
        await conn.execute('DELETE FROM incidencias WHERE id_incidencia = ?', [resId[0].id_incidencia]);
      } catch {
        bloqueado = true;
      } finally {
        conn.release();
      }
      const [[still]] = [await pool.execute('SELECT COUNT(*) c FROM incidencias WHERE id_incidencia = ?', [resId[0].id_incidencia])];
      check('RN-07: DELETE de incidencia Resuelta es bloqueado por trigger', bloqueado && still[0].c === 1);
    } else {
      console.log('  (no hay incidencia Resuelta en datos de prueba para probar RN-07 a nivel BD)');
    }
    // Sin endpoint de borrado en la API
    const delApi = await req('DELETE', `/api/incidencias/${N}`, { token: admin.token });
    check('RN-07: no existe endpoint de eliminación (DELETE -> 404)', delApi.status === 404);

    await verificarMinimos();
  } finally {
    await cleanup(created);
  }

  console.log(`\n=== RESULTADO: ${pass} PASS / ${fail} FAIL ===`);
  if (fail) {
    console.log('Fallos:', fails.join(', '));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('Error en QA:', e);
  process.exit(1);
});
