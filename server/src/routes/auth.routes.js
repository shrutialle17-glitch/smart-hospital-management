import express from 'express';
import { login, registerPatient, refreshToken, logout } from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', registerPatient); // Admin routes will handle other staff registrations
router.post('/refresh-token', refreshToken);
router.post('/logout', isAuthenticated, logout);

export default router;
