import express from 'express';
import { getAllPatients, getPatientById, updatePatientProfile, registerWalkInPatient, addMedicalRecord } from '../controllers/patientController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.post('/', hasRole(['ADMIN', 'RECEPTIONIST']), registerWalkInPatient);
router.get('/', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), getAllPatients);
router.get('/:id', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']), getPatientById);
router.patch('/:id', hasRole(['ADMIN', 'RECEPTIONIST', 'PATIENT']), updatePatientProfile);
router.post('/:id/records', hasRole(['ADMIN', 'DOCTOR']), addMedicalRecord);

export default router;
