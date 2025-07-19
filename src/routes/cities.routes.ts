import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import {  getCities, getCitiesByAdmin, createCity, updateCity, assignCityToAdmin, unassignCityFromAdmin, deleteCity } from '../controllers/cities.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('SUPER_ADMIN'), getCities);
router.get('/admin', getCitiesByAdmin);
router.post('/create', requireRole('SUPER_ADMIN'), createCity);
router.put('/:id', requireRole('SUPER_ADMIN'), updateCity);
router.put('/:id/assign', requireRole('SUPER_ADMIN'), assignCityToAdmin);
router.delete('/:id/unassign', requireRole('SUPER_ADMIN'), unassignCityFromAdmin);
router.delete('/:id', requireRole('SUPER_ADMIN'), deleteCity);


export default router;
