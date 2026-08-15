import { z } from 'zod';
import * as incidenciasService from '../services/incidencias.service.js';

const registrarSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es obligatorio').max(150),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria'),
  prioridad: z.enum(['Baja', 'Media', 'Alta']),
  id_activo: z.number().int().positive().nullable().optional(),
});

const listarQuerySchema = z.object({
  estado: z.enum(['Registrada', 'Asignada', 'En proceso', 'Resuelta']).optional(),
  prioridad: z.enum(['Baja', 'Media', 'Alta']).optional(),
});

export async function registrar(req, res, next) {
  try {
    const data = registrarSchema.parse(req.body);
    const creada = await incidenciasService.registrar({
      ...data,
      id_usuario_reporta: req.user.id_usuario,
    });
    res.status(201).json({
      success: true,
      message: 'Incidencia registrada correctamente',
      id_incidencia: creada.id_incidencia,
      codigo: creada.codigo,
    });
  } catch (err) {
    next(err);
  }
}

export async function listar(req, res, next) {
  try {
    const query = listarQuerySchema.parse(req.query);
    const incidencias = await incidenciasService.listar(query);
    res.json({ success: true, incidencias });
  } catch (err) {
    next(err);
  }
}

const asignarSchema = z.object({
  id_tecnico: z.number().int().positive(),
});

const cambiarEstadoSchema = z.object({
  estado: z.enum(['Registrada', 'Asignada', 'En proceso', 'Resuelta']),
  comentario: z.string().trim().max(200).optional(),
});

const diagnosticoSchema = z.object({
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria'),
  pruebasRealizadas: z.array(z.string().trim()).optional(),
  causaProbable: z.string().trim().optional(),
  solucionAplicada: z.string().trim().optional(),
});

const evidenciaSchema = z.object({
  tipo: z.enum(['imagen', 'documento', 'video']),
  nombre: z.string().trim().max(150).optional(),
  url: z.string().trim().min(1, 'La URL es obligatoria'),
  descripcion: z.string().trim().optional(),
});

function parseId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    const error = new Error('ID de incidencia inválido');
    error.status = 400;
    throw error;
  }
  return n;
}

export async function detalle(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const incidencia = await incidenciasService.detalle(id);
    res.json({ success: true, incidencia });
  } catch (err) {
    next(err);
  }
}

export async function asignar(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = asignarSchema.parse(req.body);
    const resultado = await incidenciasService.asignar(id, data.id_tecnico, req.user.id_usuario);
    res.json({ success: true, message: 'Incidencia asignada correctamente', ...resultado });
  } catch (err) {
    next(err);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = cambiarEstadoSchema.parse(req.body);
    const resultado = await incidenciasService.cambiarEstado(id, data.estado, data.comentario, req.user);
    res.json({ success: true, message: 'Estado actualizado correctamente', ...resultado });
  } catch (err) {
    next(err);
  }
}

export async function registrarDiagnostico(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = diagnosticoSchema.parse(req.body);
    const diagnostico = await incidenciasService.registrarDiagnostico(id, req.user.id_usuario, data);
    res.status(201).json({ success: true, message: 'Diagnóstico registrado correctamente', diagnostico });
  } catch (err) {
    next(err);
  }
}

export async function registrarEvidencia(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = evidenciaSchema.parse(req.body);
    const evidencia = await incidenciasService.registrarEvidencia(id, data);
    res.status(201).json({ success: true, message: 'Evidencia registrada correctamente', evidencia });
  } catch (err) {
    next(err);
  }
}