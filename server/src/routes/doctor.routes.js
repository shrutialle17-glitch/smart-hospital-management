import express from "express";
import { getDoctorProfile } from "../controllers/doctorController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in doctor profile
router.get("/profile", isAuthenticated, getDoctorProfile);

export default router;