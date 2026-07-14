import express from 'express';
import { getLabTests, getLabReports, createLabRequest, updateLabReport } from '../controllers/labController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';
import { uploadReport } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/tests', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_STAFF']), getLabTests);
router.get('/reports', hasRole(['ADMIN', 'DOCTOR', 'LAB_STAFF', 'PATIENT']), getLabReports);

router.post('/requests', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), createLabRequest);
router.patch('/reports/:id', hasRole(['ADMIN', 'LAB_STAFF']), uploadReport.single('report'), updateLabReport);

export default router;
