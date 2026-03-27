import express from "express";
import { signup, login } from "../controllers/doctor.js";
import { protectDoctor as auth } from "../middleware/doctorAuth.js";
import { getDoctorProfile, updateDoctorProfile } from "../controllers/doctor.js";

const router = express.Router();

// 🔓 Public routes
router.post("/signup", signup);
router.post("/login", login);

// 🔐 Protected routes (Doctor)
router.get("/profile", auth, getDoctorProfile);
router.put("/profile", auth, updateDoctorProfile);


export default router;