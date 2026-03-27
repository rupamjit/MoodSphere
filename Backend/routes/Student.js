import express from "express";
import multer from "multer";

// Controllers
import { signup, login } from "../controllers/auth.js";
import { startSession, sendMessage, endSession } from "../controllers/session.js";
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
	getStudentConsultationHistory,
	getStudentStreamToken,
} from "../controllers/consultation.js";
import { generateAndSaveBlog, getAllBlogs } from "../controllers/generateBlog.js";

// Middleware
import { protect as auth } from "../middleware/auth.js";

const router = express.Router();


// 🔥 SIMPLE MULTER SETUP (NO __dirname needed)
const upload = multer({
  dest: "uploads/", // automatically creates & stores files here
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"), false);
    }
  },
});


// ================= ROUTES =================

// 🔓 Public routes
router.post("/signup", signup);
router.post("/login", login);

// 🔐 Session routes
router.post("/start", auth, startSession);
router.post("/message", auth, upload.single("image"), sendMessage);
router.post("/end", auth, endSession);
router.get("/session/:sessionId/details", auth, getSessionDetails);
router.get("/sessions/history", auth, getStudentSessionHistory);

// 👤 Profile routes
router.get("/profile", auth, getStudentProfile);
router.put("/profile", auth, updateStudentProfile);

// 📊 Dashboard routes
router.get("/dashboard/overview", auth, getDashboardOverview);
router.get("/dashboard/trend", auth, getDashboardTrend);
router.get("/dashboard/streak", auth, getDashboardStreak);
router.get("/dashboard/recent-sessions", auth, getDashboardRecentSessions);
router.get("/dashboard/ai-tips", auth, getDashboardAiTips);

// 📝 Blog
router.post("/generate-blog", auth, generateAndSaveBlog);

export default router;


// import express from "express";
// import { signup,login } from "../controllers/auth.js";
// import { startSession, sendMessage, endSession } from "../controllers/session.js";
// import { protect as auth } from "../middleware/auth.js";
// import { getStudentProfile, updateStudentProfile } from "../controllers/profile.js";
// import {
// 	getDashboardAiTips,
// 	getDashboardOverview,
// 	getDashboardRecentSessions,
// 	getDashboardStreak,
// 	getDashboardTrend,
// } from "../controllers/dashboard.js";
// import { generateAndSaveBlog } from "../controllers/generateBlog.js";
// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import fs from "fs";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const router=express.Router();

// // Configure multer for file uploads
// const upload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       const uploadDir = path.join(__dirname, "../uploads");
//       cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}-${file.originalname}`);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed!"));
//     }
//   },
// });

// // Public routes
// router.post("/signup",signup);
// router.post("/login",login);

// // Protected routes
// router.post("/start", auth, startSession);
// router.post("/message", auth, upload.single("image"), sendMessage);
// router.post("/end", auth, endSession);

// // Additional routes for profile
// router.get("/profile", auth, getStudentProfile);
// router.put("/profile", auth, updateStudentProfile);

// // Dashboard routes
// router.get("/dashboard/overview", auth, getDashboardOverview);
// router.get("/dashboard/trend", auth, getDashboardTrend);
// router.get("/dashboard/streak", auth, getDashboardStreak);
// router.get("/dashboard/recent-sessions", auth, getDashboardRecentSessions);
// router.get("/dashboard/ai-tips", auth, getDashboardAiTips);

// router.post("/generate-blog", generateAndSaveBlog);

// export default router;
