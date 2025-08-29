import { Router } from 'express';
import { register, login, logout, refresh, changePassword, updateProfilePicture } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, changePasswordSchema, validateBody } from '../middlewares/validation.middleware';
import { uploadProfilePicture } from '../middlewares/upload.middleware';
import { loginLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', loginLimiter, validateBody(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.put('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);
router.put('/profile-picture', authenticate, uploadProfilePicture, updateProfilePicture);

export default router;