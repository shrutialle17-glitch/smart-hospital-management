import express from 'express';
import { getAllUsers, getUserById, toggleUserStatus, createUser, deleteUser } from '../controllers/userController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';
import { uploadProfileImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

// List users (Admin can list all, others can search patients)
router.get('/', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), getAllUsers);
router.post('/', hasRole(['ADMIN']), uploadProfileImage.single('profileImage'), createUser);
router.delete('/:id', hasRole(['ADMIN']), deleteUser);
router.get('/:id', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), getUserById);
router.patch('/:id/status', hasRole(['ADMIN']), toggleUserStatus);

export default router;
