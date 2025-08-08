import { Router } from 'express';
import {
    getAllAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getAdminStats
} from '../controllers/admins.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAdminSchema = z.object({
    firstname: z.string().min(1, 'Le prénom est obligatoire'),
    lastname: z.string().min(1, 'Le nom est obligatoire'),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN']).optional(),
    cityIds: z.array(z.number()).optional()
});

const updateAdminSchema = z.object({
    firstname: z.string().min(1).optional(),
    lastname: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN']).optional(),
    cityIds: z.array(z.number()).optional()
});

// All routes require authentication
router.use(authenticate);

// GET /api/admins - Get all admins
router.get('/', getAllAdmins);

// GET /api/admins/stats - Get admin statistics
router.get('/stats', getAdminStats);

// GET /api/admins/:id - Get admin by ID
router.get('/:id', getAdminById);

// POST /api/admins - Create new admin
router.post('/', validateBody(createAdminSchema), createAdmin);

// PUT /api/admins/:id - Update admin
router.put('/:id', validateBody(updateAdminSchema), updateAdmin);

// DELETE /api/admins/:id - Delete admin
router.delete('/:id', deleteAdmin);

export default router;
