import express from 'express';
import { getPublicDoctors } from '../controllers/userController.js';

const router = express.Router();

router.get('/doctors', getPublicDoctors);

export default router;
