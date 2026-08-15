import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://localhost:3000';
const ADMIN = { correo: 'carlos.mendoza@ecotec.edu.ec', contrasena: 'CampusFix2026!' };

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

async function main() {
  const aTok = await login(ADMIN);

  // 1. Reporte por estado
  const est = await req('GET', '/api/reportes/estados', { token: aTok });
  check('reportes/estados -> 200', est.status === 200, JSON.stringify(est.data));
  const estados = est.data?.datos || [];
  const nombres = estados.map((e) => e.estado);
  check('estados incluye los 4 estados', ['Registrada', 'Asignada', 'En proceso', 'Resuelta'].every((n) => nombres.includes(n)), JSON.stringify(nombres));
  check('cada estado tiene total numerico', estados.every((e) => Number.isInteger(e.total)), JSON.stringify(estados));
  check('estados ordenados por orden', estados.every((e, idx) => idx === 0 || estados[idx - 1].orden <= e.orden));

  // 2. Reporte por tecnico (reutiliza vw_resumen_por_tecnico)
  const tec = await req('GET', '/api/reportes/tecnicos', { token: aTok });
  check('reportes/tecnicos -> 200', tec.status === 200, JSON.stringify(tec.data));
  const tecnicos = tec.data?.datos || [];
  check('tecnicos es arreglo', Array.isArray(tecnicos));
  check(
    'cada tecnico tiene campos del resumen',
    tecnicos.every(
      (t) =>
        Number.isInteger(t.id_tecnico) &&
        typeof t.tecnico === 'string' &&
        Number.isInteger(t.total_incidencias) &&
        Number.isInteger(t.incidencias_activas) &&
        Number.isInteger(t.incidencias_resueltas) &&
        Number.isInteger(t.funcion_incidencias_activas)
    ),
    JSON.stringify(tecnicos)
  );
  // Coherencia: total >= activas + resueltas por tecnico
  check(
    'coherencia total >= activas + resueltas',
    tecnicos.every((t) => t.total_incidencias >= t.incidencias_activas + t.incidencias_resueltas)
  );

  // 3. Sin token -> 401
  const noTok = await req('GET', '/api/reportes/estados', {});
  check('reportes sin token -> 401', noTok.status === 401, `status=${noTok.status}`);

  // 4. Coherencia global: suma de totales por estado == COUNT(*) incidencias
  const pool = (await import('../src/config/mysql.js')).default;
  const [cnt] = await pool.execute('SELECT COUNT(*) AS n FROM incidencias');
  const suma = estados.reduce((s, e) => s + e.total, 0);
  check('suma por estado == total incidencias', suma === cnt[0].n, `suma=${suma} total=${cnt[0].n}`);

  console.log(`\nResultado Fase 5: ${pass} PASS / ${fail} FAIL`);
  if (fail) {
    console.log('Fallos:', fails.join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Error en pruebas:', e);
  process.exit(1);
});
