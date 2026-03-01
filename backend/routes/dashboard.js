import { Router } from 'express';
import { getStats, getActivityLog } from '../controllers/dashboardController.js';
import { authenticate, requireManager } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireManager);
router.get('/stats',    getStats);
router.get('/activity', getActivityLog);
export default router;
