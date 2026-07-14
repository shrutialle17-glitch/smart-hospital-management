import express from "express";
import { createPrescription } from "../controllers/prescriptionController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Prescription
router.post("/", isAuthenticated, createPrescription);

export default router;