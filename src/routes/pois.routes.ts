import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { uploadPOIFiles } from '../middlewares/upload.middleware';
import { 
    getPOIs, 
    getPOIById, 
    getPOIsByCity, 
    getPOIsByAdmin,
    createPOI, 
    createPOIAsAdmin,
    updatePOI, 
    updatePOIAsAdmin,
    deletePOI,
    deletePOIAsAdmin
} from '../controllers/pois.controller';
import { createPOISchema, updatePOISchema, validateBody, idParamSchema, validateParams } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('SUPER_ADMIN'), getPOIs);
router.get('/admin', getPOIsByAdmin);
router.get('/:id', validateParams(idParamSchema), getPOIById);
router.get('/city/:cityId', getPOIsByCity);
router.post('/create', requireRole('SUPER_ADMIN'), uploadPOIFiles, validateBody(createPOISchema), createPOI);
router.post('/admin/create', uploadPOIFiles, validateBody(createPOISchema), createPOIAsAdmin);
router.put('/:id', requireRole('SUPER_ADMIN'), validateParams(idParamSchema), validateBody(updatePOISchema), updatePOI);
router.put('/admin/:id', validateParams(idParamSchema), validateBody(updatePOISchema), updatePOIAsAdmin);
router.delete('/:id', requireRole('SUPER_ADMIN'), validateParams(idParamSchema), deletePOI);
router.delete('/admin/:id', validateParams(idParamSchema), deletePOIAsAdmin);

export default router;