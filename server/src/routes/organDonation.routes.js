import express from 'express';
import {
  getDonors, createDonor,
  getRecipients, createRecipient,
  getMatches, createMatch, updateMatchStatus
} from '../controllers/organDonationController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);

// Donors
router.get('/donors', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_STAFF']), getDonors);
router.post('/donors', hasRole(['ADMIN', 'DOCTOR','LAB_STAFF']), createDonor);

// Recipients
router.get('/recipients', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_STAFF']), getRecipients);
router.post('/recipients', hasRole(['ADMIN', 'DOCTOR','LAB_STAFF']), createRecipient);

// Matches
router.get('/matches', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_STAFF']), getMatches);
router.post('/matches', hasRole(['ADMIN', 'DOCTOR','LAB_STAFF']), createMatch);
router.patch('/matches/:id', hasRole(['ADMIN']), updateMatchStatus);

export default router;
