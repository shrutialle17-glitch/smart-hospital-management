import express from "express";
import {
  createPrescription,
  getPatientPrescriptions,
} from "../controllers/prescriptionController.js";
import {
  isAuthenticated,
  hasRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Doctor creates prescription
router.post(
  "/",
  isAuthenticated,
  hasRole(["DOCTOR"]),
  createPrescription
);

// Patient views own prescriptions
router.get(
  "/my",
  isAuthenticated,
  hasRole(["PATIENT"]),
  getPatientPrescriptions
);

export default router;