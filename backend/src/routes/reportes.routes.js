import { Router } from 'express';
import * as reportesController from '../controllers/reportes.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/estados', authenticate, reportesController.porEstado);
router.get('/tecnicos', authenticate, reportesController.porTecnico);

export default router;