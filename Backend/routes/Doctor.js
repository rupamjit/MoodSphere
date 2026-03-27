import express from "express";
import { signup, login } from "../controllers/doctor.js";
import { protectDoctor as auth } from "../middleware/doctorAuth.js";
import {
	getDoctorProfile,
	updateDoctorProfile,
	getCurrentConsultations,
	getCompletedConsultations,
} from "../controllers/doctor.js";
import {
	getDoctorStreamToken,
  completeConsultation,
} from "../controllers/consultation.js";

const router = express.Router();

// 🔓 Public routes
router.post("/signup", signup);
router.post("/login", login);

// 🔐 Protected routes (Doctor)
router.get("/profile", auth, getDoctorProfile);
router.put("/profile", auth, updateDoctorProfile);
router.get("/consultations/current", auth, getCurrentConsultations);
router.get("/consultations/history", auth, getCompletedConsultations);
router.post("/consultations/:consultationId/stream-token", auth, getDoctorStreamToken);
router.patch("/consultations/:consultationId/complete", auth, completeConsultation);


export default router;