import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import {  getVilles, createVille } from '../controllers/villes.controller';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));


router.get('/', getVilles);
router.post('/create', createVille);

export default router;
