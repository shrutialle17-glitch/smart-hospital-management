import express from "express";
import {
  getLiveQueue,
  addPatientToQueue,
} from "../controllers/liveQueue.controller.js";

const router = express.Router();

router.get("/", getLiveQueue);
router.post("/", addPatientToQueue);

export default router;