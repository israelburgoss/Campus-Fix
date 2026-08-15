import { ZodError } from 'zod';
import env from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
  });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0]?.message || 'Datos inválidos',
    });
  }

  const status = err.status || err.statusCode || 500;
  const isServerError = status >= 500;
  const message =
    isServerError && env.nodeEnv === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  if (isServerError) {
    console.error(err);
  }

  res.status(status).json({ success: false, message });
}