import express from 'express';
import { getAllAppointments, createAppointment, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']), getAllAppointments);
router.post('/', hasRole(['ADMIN', 'RECEPTIONIST', 'PATIENT', 'DOCTOR']), createAppointment);
router.patch('/:id/status', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']), updateAppointmentStatus);

export default router;
