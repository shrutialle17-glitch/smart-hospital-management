import express from "express";
import {
  getDoctorWorkspace,
  updateDoctorWorkspace,
} from "../controllers/doctorWorkspace.controller.js";

const router = express.Router();

router.get("/", getDoctorWorkspace);
router.put("/", updateDoctorWorkspace);

export default router;