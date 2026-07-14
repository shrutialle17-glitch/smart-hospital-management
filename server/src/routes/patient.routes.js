import express from "express";
import {
  getPatientProfile,
  updatePatientProfile,
} from "../controllers/patientController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in patient profile
router.get("/profile", isAuthenticated, getPatientProfile);

// Update logged-in patient profile
router.put("/profile", isAuthenticated, updatePatientProfile);

export default router;