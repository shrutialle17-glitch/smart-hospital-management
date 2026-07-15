import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);
router.get('/metrics', hasRole(['ADMIN']), getDashboardMetrics);

export default router;
