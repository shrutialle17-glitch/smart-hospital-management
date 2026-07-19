import express from 'express';
import { getAllPatients, getPatientById, updatePatientProfile, registerWalkInPatient, addMedicalRecord, getPatientTimeline } from '../controllers/patientController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';
import { uploadMedicalRecord } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.post('/', hasRole(['ADMIN', 'RECEPTIONIST']), registerWalkInPatient);
router.get('/', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), getAllPatients);
router.get('/:id', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']), getPatientById);
router.patch('/:id', hasRole(['ADMIN', 'RECEPTIONIST', 'PATIENT']), updatePatientProfile);
router.post('/:id/records', hasRole(['ADMIN', 'DOCTOR']), uploadMedicalRecord.single('file'), addMedicalRecord);
router.get('/:id/timeline', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']), getPatientTimeline);

export default router;
