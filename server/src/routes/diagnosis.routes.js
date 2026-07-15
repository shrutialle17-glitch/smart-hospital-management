import express from "express";
import {
  createDiagnosis,
  getDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
} from "../controllers/diagnosisController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", isAuthenticated, createDiagnosis);

router.get("/:patientId", isAuthenticated, getDiagnosis);

router.put("/:id", isAuthenticated, updateDiagnosis);

router.delete("/:id", isAuthenticated, deleteDiagnosis);

export default router;