import express from "express";
import { getPatientProfile } from "../controllers/patientController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in patient's profile
router.get("/profile", isAuthenticated, getPatientProfile);

export default router;