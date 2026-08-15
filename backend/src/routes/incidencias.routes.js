import { Router } from 'express';
import * as incidenciasController from '../controllers/incidencias.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.post('/', authenticate, incidenciasController.registrar);
router.get('/', authenticate, incidenciasController.listar);
router.get('/:id', authenticate, incidenciasController.detalle);
router.put('/:id/asignar', authenticate, authorize('Administrador'), incidenciasController.asignar);
router.put('/:id/estado', authenticate, incidenciasController.cambiarEstado);
router.post('/:id/diagnosticos', authenticate, incidenciasController.registrarDiagnostico);
router.post('/:id/evidencias', authenticate, authorize('Tecnico', 'Administrador'), incidenciasController.registrarEvidencia);

export default router;