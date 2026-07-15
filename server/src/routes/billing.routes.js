import express from 'express';
import { getBills, createBill, recordPayment } from '../controllers/billingController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', hasRole(['ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'PATIENT']), getBills);
router.post('/', hasRole(['ADMIN', 'RECEPTIONIST', 'PHARMACIST']), createBill);
router.post('/:id/payments', hasRole(['ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'PATIENT']), recordPayment);

export default router;
