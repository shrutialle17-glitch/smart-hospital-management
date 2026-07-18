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
router.get('/donors', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), getDonors);
router.post('/donors', hasRole(['ADMIN', 'DOCTOR']), createDonor);

// Recipients
router.get('/recipients', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), getRecipients);
router.post('/recipients', hasRole(['ADMIN', 'DOCTOR']), createRecipient);

// Matches
router.get('/matches', hasRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']), getMatches);
router.post('/matches', hasRole(['ADMIN', 'DOCTOR']), createMatch);
router.patch('/matches/:id', hasRole(['ADMIN']), updateMatchStatus);

export default router;
