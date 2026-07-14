import express from "express";
import {
  getDoctorProfile,
  updateDoctorProfile,
} from "../controllers/doctorController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get Doctor Profile
router.get("/profile", isAuthenticated, getDoctorProfile);

// Update Doctor Profile
router.put("/profile", isAuthenticated, updateDoctorProfile);

export default router;