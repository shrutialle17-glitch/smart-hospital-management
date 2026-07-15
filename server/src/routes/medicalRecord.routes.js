import express from "express";
import {
  addMedicalRecord,
  getMedicalHistory,
  updateMedicalRecord,
  deleteMedicalRecord,
} from "../controllers/medicalRecordController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Add Medical Record
router.post("/", isAuthenticated, addMedicalRecord);

// Get Patient Medical History
router.get("/:patientId", isAuthenticated, getMedicalHistory);

// Update Medical Record
router.put("/:id", isAuthenticated, updateMedicalRecord);

// Delete Medical Record
router.delete("/:id", isAuthenticated, deleteMedicalRecord);

export default router;