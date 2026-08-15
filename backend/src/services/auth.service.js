import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/mysql.js';
import env from '../config/env.js';

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}

async function findUserByCorreo(correo) {
  const [rows] = await pool.execute(
    `SELECT
       u.id_usuario,
       u.nombres,
       u.apellidos,
       u.correo,
       u.activo,
       u.contrasena_hash,
       r.nombre_rol AS rol
     FROM usuarios u
     INNER JOIN roles r ON r.id_rol = u.id_rol
     WHERE u.correo = ?`,
    [correo]
  );
  return rows[0] || null;
}

export async function login(correo, contrasena) {
  const usuario = await findUserByCorreo(correo);

  if (!usuario) {
    throw new AuthError('Correo o contraseña incorrectos');
  }

  if (!usuario.activo) {
    throw new AuthError('El usuario está inactivo', 403);
  }

  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!contrasenaValida) {
    throw new AuthError('Correo o contraseña incorrectos');
  }

  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.rol },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}

export async function perfil(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT
       u.id_usuario,
       u.nombres,
       u.apellidos,
       u.correo,
       u.activo,
       r.nombre_rol AS rol
     FROM usuarios u
     INNER JOIN roles r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = ?`,
    [idUsuario]
  );
  const usuario = rows[0];
  if (!usuario) {
    throw new AuthError('Usuario no encontrado', 404);
  }
  return usuario;
}