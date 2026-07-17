import express from 'express';
import {
  getEmergencyStatus, dispatchEmergencyAmbulance, requestIcuBed, requestEmergencyBlood
} from '../controllers/emergencyController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/status', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), getEmergencyStatus);
router.post('/dispatch-ambulance', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), dispatchEmergencyAmbulance);
router.post('/request-icu', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), requestIcuBed);
router.post('/request-blood', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), requestEmergencyBlood);

export default router;
