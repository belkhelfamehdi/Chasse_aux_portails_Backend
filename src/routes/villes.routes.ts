import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import {  getVilles, getVillesByAdmin, createVille } from '../controllers/villes.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['SUPER_ADMIN']), getVilles);
router.post('/create', requireRole(['SUPER_ADMIN']), createVille);
router.get('/admin', requireRole(['ADMIN', 'SUPER_ADMIN']), getVillesByAdmin);


export default router;
