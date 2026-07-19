import express from 'express';
import {
  getInventory, addInventory,
  getDonors, createDonor,
  getBloodRequests, createBloodRequest, updateBloodRequest
} from '../controllers/bloodBankController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

// Inventory
router.get('/inventory', hasRole(['ADMIN', 'LAB_STAFF', 'DOCTOR', 'RECEPTIONIST']), getInventory);
router.post('/inventory', hasRole(['ADMIN', 'LAB_STAFF']), addInventory);

// Donors
router.get('/donors', hasRole(['ADMIN', 'LAB_STAFF']), getDonors);
router.post('/donors', hasRole(['ADMIN', 'LAB_STAFF']), createDonor);

// Requests
router.get('/requests', hasRole(['ADMIN', 'LAB_STAFF', 'DOCTOR', 'PATIENT']), getBloodRequests);
router.post('/requests', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), createBloodRequest);
router.patch('/requests/:id', hasRole(['ADMIN', 'LAB_STAFF']), updateBloodRequest);

export default router;
