import express from "express";
import { signup,login } from "../controllers/auth.js";
import { startSession, sendMessage, endSession } from "../controllers/session.js";
import { protect as auth } from "../middleware/auth.js";

const router=express.Router();

// Public routes
router.post("/signup",signup);
router.post("/login",login);

// Protected routes
router.post("/start", auth, startSession);
router.post("/message", auth, sendMessage);
router.post("/end", auth, endSession);

export default router;
