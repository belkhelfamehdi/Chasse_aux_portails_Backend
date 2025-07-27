import { Router } from 'express';
import { register, login, logout, refresh } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, validateBody } from '../middlewares/validation.middleware';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh', authenticate, refresh);

export default router;