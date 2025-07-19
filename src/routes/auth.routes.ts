import { Router } from 'express';
import { register, login, logout, refresh } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/refresh', authenticate, refresh)

export default router;