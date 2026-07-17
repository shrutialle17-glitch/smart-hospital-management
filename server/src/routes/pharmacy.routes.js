import express from 'express';
import { getMedicines, addMedicine, updateStock, getCategories, getPrescriptions, createPrescription, updatePrescriptionStatus, getIntelligence } from '../controllers/pharmacyController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/categories', hasRole(['ADMIN', 'PHARMACIST', 'DOCTOR']), getCategories);
router.get('/medicines', hasRole(['ADMIN', 'PHARMACIST', 'DOCTOR']), getMedicines);

router.post('/medicines', hasRole(['ADMIN', 'PHARMACIST']), addMedicine);
router.patch('/medicines/:id/stock', hasRole(['ADMIN', 'PHARMACIST']), updateStock);

router.get('/prescriptions', hasRole(['ADMIN', 'PHARMACIST', 'DOCTOR', 'PATIENT']), getPrescriptions);
router.post('/prescriptions', hasRole(['ADMIN', 'DOCTOR']), createPrescription);
router.patch('/prescriptions/:id/status', hasRole(['ADMIN', 'PHARMACIST']), updatePrescriptionStatus);

router.get('/intelligence', hasRole(['ADMIN', 'PHARMACIST']), getIntelligence);

export default router;
