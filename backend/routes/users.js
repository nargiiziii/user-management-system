import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, bulkAction, updateProfile } from '../controllers/usersController.js';
import { authenticate, requireAdmin, requireManager } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/',           requireManager, getUsers);
router.get('/:id',        getUserById);
router.post('/',          requireAdmin,   createUser);
router.put('/me/profile', updateProfile);
router.put('/:id',        requireManager, updateUser);
router.delete('/:id',     requireAdmin,   deleteUser);
router.post('/bulk',      requireAdmin,   bulkAction);
export default router;
