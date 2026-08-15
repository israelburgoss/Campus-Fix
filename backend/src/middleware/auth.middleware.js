import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    const error = new Error('No se proporcionó un token de autenticación');
    error.status = 401;
    return next(error);
  }

  const token = header.slice(7).trim();

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = { id_usuario: payload.id_usuario, rol: payload.rol };
    next();
  } catch {
    const error = new Error('Token inválido o expirado');
    error.status = 401;
    next(error);
  }
}