import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import {  getCities, getCityById, getCitiesByAdmin, createCity, updateCity, assignCityToAdmin, unassignCityFromAdmin, deleteCity } from '../controllers/cities.controller';
import { createCitySchema, updateCitySchema, validateBody, idParamSchema, validateParams } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('SUPER_ADMIN'), getCities);
router.get('/admin', getCitiesByAdmin);
router.get('/:id', validateParams(idParamSchema), getCityById);
router.post('/create', requireRole('SUPER_ADMIN'), validateBody(createCitySchema), createCity);
router.put('/:id', requireRole('SUPER_ADMIN'), validateParams(idParamSchema), validateBody(updateCitySchema), updateCity);
router.put('/:id/assign', requireRole('SUPER_ADMIN'), assignCityToAdmin);
router.delete('/:id/unassign', requireRole('SUPER_ADMIN'), validateParams(idParamSchema), unassignCityFromAdmin);
router.delete('/:id', requireRole('SUPER_ADMIN'), validateParams(idParamSchema), deleteCity);


export default router;
