import express from 'express';
import { getWards, getBeds, createBed, assignBed, releaseBed, updateBedStatus } from '../controllers/bedController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/wards', hasRole(['ADMIN', 'RECEPTIONIST', 'DOCTOR']), getWards);
router.get('/', hasRole(['ADMIN', 'RECEPTIONIST', 'DOCTOR']), getBeds);
router.post('/', hasRole(['ADMIN']), createBed);
router.patch('/:id/assign', hasRole(['ADMIN', 'RECEPTIONIST']), assignBed);
router.patch('/:id/release', hasRole(['ADMIN', 'RECEPTIONIST']), releaseBed);
router.patch('/:id/status', hasRole(['ADMIN', 'RECEPTIONIST']), updateBedStatus);

export default router;
