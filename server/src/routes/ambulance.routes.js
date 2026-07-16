import express from 'express';
import { getAmbulances, getAmbulanceRequests, createAmbulanceRequest, updateAmbulanceRequest } from '../controllers/ambulanceController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', hasRole(['ADMIN', 'RECEPTIONIST', 'DOCTOR']), getAmbulances);
router.get('/requests', hasRole(['ADMIN', 'RECEPTIONIST', 'DOCTOR']), getAmbulanceRequests);
router.post('/requests', hasRole(['ADMIN', 'RECEPTIONIST']), createAmbulanceRequest);
router.patch('/requests/:id', hasRole(['ADMIN', 'RECEPTIONIST']), updateAmbulanceRequest);

export default router;
