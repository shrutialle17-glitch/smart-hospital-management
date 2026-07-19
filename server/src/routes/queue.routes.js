import express from 'express';
import {
  getAllQueues, getDoctorQueue, getPatientQueueToken,
  checkIn, callToken, completeToken, skipToken
} from '../controllers/queueController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', hasRole(['ADMIN', 'RECEPTIONIST']), getAllQueues);
router.get('/doctor/:id', hasRole(['ADMIN', 'RECEPTIONIST', 'DOCTOR']), getDoctorQueue);
router.get('/patient', hasRole(['PATIENT']), getPatientQueueToken);

router.post('/check-in', hasRole(['ADMIN', 'RECEPTIONIST']), checkIn);
router.patch('/:id/call', hasRole(['DOCTOR']), callToken);
router.patch('/:id/complete', hasRole(['DOCTOR']), completeToken);
router.patch('/:id/skip', hasRole(['DOCTOR', 'RECEPTIONIST']), skipToken);

export default router;
