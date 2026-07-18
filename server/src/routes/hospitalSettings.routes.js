import express from 'express';
import { getHospitalSettings, updateHospitalSettings } from '../controllers/hospitalSettingsController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', hasRole(['ADMIN']), getHospitalSettings);
router.put('/', hasRole(['ADMIN']), updateHospitalSettings);

export default router;
