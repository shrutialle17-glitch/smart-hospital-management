import express from "express";
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorAppointments,
} from "../controllers/doctorController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", isAuthenticated, getDoctorProfile);

router.put("/profile", isAuthenticated, updateDoctorProfile);

router.get("/appointments", isAuthenticated, getDoctorAppointments);

export default router;