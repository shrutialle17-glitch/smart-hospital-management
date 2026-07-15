import express from "express";
import {
  createFollowUp,
  getFollowUps,
  updateFollowUp,
  deleteFollowUp,
} from "../controllers/followUpController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", isAuthenticated, createFollowUp);

router.get("/:patientId", isAuthenticated, getFollowUps);

router.put("/:id", isAuthenticated, updateFollowUp);

router.delete("/:id", isAuthenticated, deleteFollowUp);

export default router;