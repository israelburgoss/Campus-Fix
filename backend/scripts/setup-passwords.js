import bcrypt from 'bcryptjs';
import pool from '../src/config/mysql.js';
import env from '../src/config/env.js';

const password = env.defaultPassword;
const saltRounds = 10;

try {
  const [usuarios] = await pool.execute(
    'SELECT id_usuario, correo FROM usuarios ORDER BY id_usuario'
  );

  console.log(`Actualizando contraseñas de ${usuarios.length} usuarios...`);
  console.log(`Contraseña por defecto: "${password}"`);

  let actualizados = 0;
  for (const usuario of usuarios) {
    const hash = await bcrypt.hash(password, saltRounds);
    await pool.execute(
      'UPDATE usuarios SET contrasena_hash = ? WHERE id_usuario = ?',
      [hash, usuario.id_usuario]
    );
    actualizados++;
    console.log(`  OK id=${usuario.id_usuario} (${usuario.correo})`);
  }

  console.log(`\nListo: ${actualizados} usuarios actualizados con hash bcrypt real.`);
} catch (err) {
  console.error('Error ejecutando setup de contraseñas:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}