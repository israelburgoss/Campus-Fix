import * as reportesService from '../services/reportes.service.js';

export async function porEstado(req, res, next) {
  try {
    const datos = await reportesService.porEstado();
    res.json({ success: true, datos });
  } catch (err) {
    next(err);
  }
}

export async function porTecnico(req, res, next) {
  try {
    const datos = await reportesService.porTecnico();
    res.json({ success: true, datos });
  } catch (err) {
    next(err);
  }
}
