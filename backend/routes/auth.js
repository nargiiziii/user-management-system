import { Router } from 'express';
import { register, login, refresh, logout, getMe, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.post('/register',         authLimiter, register);
router.post('/login',            authLimiter, login);
router.post('/refresh',          refresh);
router.post('/logout',           authenticate, logout);
router.get('/me',                authenticate, getMe);
router.put('/change-password',   authenticate, changePassword);
export default router;
