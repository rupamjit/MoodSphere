import Session from "../models/session.js";
import CryptoJS from "crypto-js";
import Student from "../models/Student.js";
import { getFinalAIResponse } from "../services/aiService.js";

// Weights for final score (can be set via env: WEIGHT_TEXT, WEIGHT_VOICE, WEIGHT_FACE)
let W_TEXT = typeof process.env.WEIGHT_TEXT !== "undefined" ? Number(process.env.WEIGHT_TEXT) : 0.6;
let W_VOICE = typeof process.env.WEIGHT_VOICE !== "undefined" ? Number(process.env.WEIGHT_VOICE) : 0.2;
let W_FACE = typeof process.env.WEIGHT_FACE !== "undefined" ? Number(process.env.WEIGHT_FACE) : 0.2;
const _weightSum = W_TEXT + W_VOICE + W_FACE;
if (_weightSum && _weightSum !== 1) {
  W_TEXT = W_TEXT / _weightSum;
  W_VOICE = W_VOICE / _weightSum;
  W_FACE = W_FACE / _weightSum;
}


// Start a new session
export const startSession = async (req, res) => {
  try {
    const { duration } = req.body;

    const session = await Session.create({
      studentId: req.user.id,
      sessionDuration: duration,
    });

    const student = await Student.findById(req.user.id);
    student.allSessions.push(session._id);
    await student.save();

    res.status(201).json(session);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Encrypt
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, process.env.SECRET_KEY).toString();
};
// controllers/session.js

export const sendMessage = async (req, res) => {
  try {
    const { sessionId, message, studentData } = req.body;

    // 1️⃣ Find session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    // 2️⃣ Call AI Service (🔥 MAIN CHANGE)
    const aiResult = await getFinalAIResponse({
      message,
      studentData,
    });

    console.log("AI Result:", aiResult);

    if (!aiResult.success) {
      return res.status(500).json({ msg: "AI processing failed" });
    }

    const data = aiResult.data;

    // 3️⃣ Prepare scores (fallback safe)
    const textScore = data.confidence || 0;   // from emotion model
    const voiceScore = 0;
    const faceScore = 0;

    // 4️⃣ Calculate final score
    const finalScore =
      W_TEXT * textScore +
      W_VOICE * voiceScore +
      W_FACE * faceScore;

    // 5️⃣ Save message in DB
    session.messages.push({
      userMessage: encrypt(message),
      aiResponse: data.reply,
      textScore,
      voiceScore,
      faceScore,
      finalScore,
      emotion: data.finalEmotion,
    });

    await session.save();

    // 6️⃣ Send response
    res.status(200).json({
      reply: data.reply,
      emotion: data.finalEmotion,
      score: finalScore,
      riskLevel: data.riskLevel,
      action: data.action,
    });

  } catch (error) {
    console.error("SendMessage Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// End session and calculate final mood
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // 1️⃣ Get session
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    // 2️⃣ Get student
    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    const msgs = session.messages;

    if (msgs.length === 0) {
      return res.status(400).json({ msg: "No messages in session" });
    }

    // 3️⃣ Calculate averages
    const avgText =
      msgs.reduce((sum, m) => sum + (m.textScore || 0), 0) / msgs.length;

    const avgVoice =
      msgs.reduce((sum, m) => sum + (m.voiceScore || 0), 0) / msgs.length;

    const avgFace =
      msgs.reduce((sum, m) => sum + (m.faceScore || 0), 0) / msgs.length;

    // 4️⃣ Final weighted score
    const finalScore =
      W_TEXT * avgText + W_VOICE * avgVoice + W_FACE * avgFace;

    // 5️⃣ Mood + Risk
    let finalMood = "neutral";
    if (finalScore > 0.2) finalMood = "positive";
    else if (finalScore < -0.2) finalMood = "negative";

    let riskLevel = "low";
    if (finalScore < -0.5) riskLevel = "high";
    else if (finalScore < -0.2) riskLevel = "medium";

    // 6️⃣ Update session
    session.averageTextScore = avgText;
    session.averageVoiceScore = avgVoice;
    session.averageFaceScore = avgFace;
    session.finalScore = finalScore;
    session.finalMood = finalMood;
    session.riskLevel = riskLevel;
    session.status = "completed";
    session.endedAt = new Date();

    await session.save();

    // 7️⃣ Update student (IMPORTANT PART 🔥)

    student.currentMood = finalMood;
    student.moodScore = finalScore;
    student.riskLevel = riskLevel;

    // 📊 Push into mood history
    student.moodHistory.push({
      textScore: avgText,
      voiceScore: avgVoice,
      faceScore: avgFace,   // FIXED
      finalScore: finalScore,
      emotion: finalMood,
      date: new Date(),
    });

    student.lastActive = new Date();

    await student.save();

    // 8️⃣ Response
    res.status(200).json({
      success: true,
      session: {
        finalScore,
        finalMood,
        riskLevel,
      },
      student: {
        currentMood: student.currentMood,
        moodScore: student.moodScore,
        riskLevel: student.riskLevel,
      },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};