import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { getPOIs, getPOIById, getPOIsByCity, createPOI, updatePOI, deletePOI } from '../controllers/pois.controller';
import { createPOISchema, updatePOISchema, validateBody, idParamSchema, validateParams } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('SUPER_ADMIN'), getPOIs);
router.get('/:id', validateParams(idParamSchema), getPOIById);
router.get('/city/:cityId', getPOIsByCity);
router.post('/create', requireRole('SUPER_ADMIN'), validateBody(createPOISchema), createPOI);
router.put('/:id', requireRole('SUPER_ADMIN'), validateParams(idParamSchema), validateBody(updatePOISchema), updatePOI);
router.delete('/:id', requireRole('SUPER_ADMIN'), validateParams(idParamSchema), deletePOI);

export default router;