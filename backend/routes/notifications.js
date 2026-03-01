import { Router } from 'express';
import { getNotifications, markRead, markAllRead, deleteNotification, sendNotification } from '../controllers/notificationsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/',              getNotifications);
router.put('/read-all',      markAllRead);
router.put('/:id/read',      markRead);
router.delete('/:id',        deleteNotification);
router.post('/send',         requireAdmin, sendNotification);
export default router;
