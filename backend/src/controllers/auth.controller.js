import { z } from 'zod';
import * as authService from '../services/auth.service.js';

const loginSchema = z.object({
  correo: z.string().trim().email('Correo inválido'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
});

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const resultado = await authService.login(data.correo, data.contrasena);
    res.json({ success: true, ...resultado });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const error = new Error(err.issues[0].message);
      error.status = 400;
      return next(error);
    }
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const usuario = await authService.perfil(req.user.id_usuario);
    res.json({ success: true, usuario });
  } catch (err) {
    next(err);
  }
}