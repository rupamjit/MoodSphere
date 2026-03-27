import express from "express";
import { signup,login } from "../controllers/auth.js";
import { startSession, sendMessage, endSession, getSessionDetails } from "../controllers/session.js";
import { protect as auth } from "../middleware/auth.js";
import { getStudentProfile, updateStudentProfile } from "../controllers/profile.js";
import {
	getDashboardAiTips,
	getDashboardOverview,
	getDashboardRecentSessions,
	getDashboardStreak,
	getDashboardTrend,
} from "../controllers/dashboard.js";
import {
  listAvailableDoctors,
  createConsultation,
  getStudentCurrentConsultations,
	getStudentStreamToken,
} from "../controllers/consultation.js";
import { generateAndSaveBlog } from "../controllers/generateBlog.js";

const router=express.Router();

// Public routes
router.post("/signup",signup);
router.post("/login",login);

// Protected routes
router.post("/start", auth, startSession);
router.post("/message", auth, sendMessage);
router.post("/end", auth, endSession);
router.get("/session/:sessionId/details", auth, getSessionDetails);

// Additional routes for profile
router.get("/profile", auth, getStudentProfile);
router.put("/profile", auth, updateStudentProfile);

// Dashboard routes
router.get("/dashboard/overview", auth, getDashboardOverview);
router.get("/dashboard/trend", auth, getDashboardTrend);
router.get("/dashboard/streak", auth, getDashboardStreak);
router.get("/dashboard/recent-sessions", auth, getDashboardRecentSessions);
router.get("/dashboard/ai-tips", auth, getDashboardAiTips);

// Consultation routes
router.get("/consultants", auth, listAvailableDoctors);
router.get("/consultations/current", auth, getStudentCurrentConsultations);
router.post("/consultations", auth, createConsultation);
router.post("/consultations/:consultationId/stream-token", auth, getStudentStreamToken);
router.post("/generate-blog", generateAndSaveBlog);

export default router;
