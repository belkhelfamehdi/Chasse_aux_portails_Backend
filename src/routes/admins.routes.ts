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
import { uploadProfilePicture } from '../middlewares/upload.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const coerceCityIds = z.preprocess((val) => {
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return undefined; }
    }
    return val;
}, z.array(z.number()));

const createAdminSchema = z.object({
    firstname: z.string().min(1, 'Le prénom est obligatoire'),
    lastname: z.string().min(1, 'Le nom est obligatoire'),
    email: z.string().email({ message: 'Email invalide' }),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN']).optional(),
    cityIds: coerceCityIds.optional(),
    profilePicture: z.any().optional()
});

const updateAdminSchema = z.object({
    firstname: z.string().min(1).optional(),
    lastname: z.string().min(1).optional(),
    email: z.string().email({ message: 'Email invalide' }).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN']).optional(),
    cityIds: coerceCityIds.optional(),
    profilePicture: z.any().optional()
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
router.post('/', uploadProfilePicture, validateBody(createAdminSchema), createAdmin);

// PUT /api/admins/:id - Update admin
router.put('/:id', uploadProfilePicture, validateBody(updateAdminSchema), updateAdmin);

// DELETE /api/admins/:id - Delete admin
router.delete('/:id', deleteAdmin);

export default router;
