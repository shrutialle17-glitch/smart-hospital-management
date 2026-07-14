import express from "express";
import {
  bookAppointment,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Book Appointment
router.post("/book", isAuthenticated, bookAppointment);

// Update Appointment Status
router.patch(
  "/:appointmentId/status",
  isAuthenticated,
  updateAppointmentStatus
);

export default router;