import express from 'express';
import { createVoiceNote, getVoiceNotes } from '../controllers/voiceNoteController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';
import { uploadVoiceNote } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);
router.use(hasRole(['DOCTOR'])); // Only doctors can upload and view voice notes

router.post('/upload', uploadVoiceNote.single('audio'), createVoiceNote);
router.get('/', getVoiceNotes);

export default router;
