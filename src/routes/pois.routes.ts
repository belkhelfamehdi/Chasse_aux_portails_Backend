import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { getPOIs, getPOIById, getPOIsByCity, createPOI, updatePOI, deletePOI } from '../controllers/pois.controller';

const router = Router();

router.use(authenticate);

router.get('/', getPOIs);
router.get('/:id', getPOIById);
router.get('/city/:cityId', getPOIsByCity);
router.post('/create', requireRole('SUPER_ADMIN'), createPOI);
router.put('/:id', requireRole('SUPER_ADMIN'), updatePOI);
router.delete('/:id', requireRole('SUPER_ADMIN'), deletePOI);

export default router;