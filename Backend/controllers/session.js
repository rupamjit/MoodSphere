import Session from "../models/Session.js";
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

const decrypt = (text) => {
  try {
    if (!text) return "";
    const bytes = CryptoJS.AES.decrypt(text, process.env.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8) || text;
  } catch {
    return text;
  }
};

const emotionBaseScore = (emotion) => {
  const label = String(emotion || "").toLowerCase();
  if (["very_negative", "negative", "sad", "angry", "fear", "stressed", "stress", "anxious", "tired", "unease", "disappointment", "disappointed", "low"].some((token) => label.includes(token))) return -0.8;
  if (["neutral", "calm", "reflective"].some((token) => label.includes(token))) return 0;
  if (["very_positive", "positive", "happy", "hopeful", "joy", "joyful", "excited"].some((token) => label.includes(token))) return 0.8;
  return 0;
};

const clamp01 = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(1, parsed));
};

const toRiskLevel = (score) => {
  if (score < -0.5) return "high";
  if (score < -0.2) return "medium";
  return "low";
};

const keywordSentimentScore = (message) => {
  const text = String(message || "").toLowerCase();
  if (!text.trim()) return 0;

  const negativeTokens = [
    "bad", "depression", "depressed", "hopeless", "stress", "stressed", "anxious", "anxiety",
    "sad", "cry", "overwhelmed", "devastated", "hurt", "pain", "helpless", "suicide", "self-harm",
    "fail", "failed", "zero marks", "panic", "unease", "disappointment", "disappointed",
  ];

  const positiveTokens = [
    "good", "great", "happy", "joy", "joyful", "excited", "hopeful", "better", "calm", "fine",
    "relaxed", "peaceful", "grateful", "confident", "motivated", "amazing", "wonderful",
  ];

  const negCount = negativeTokens.reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0);
  const posCount = positiveTokens.reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0);

  if (negCount === 0 && posCount === 0) return 0;
  if (negCount > posCount) return -0.7;
  if (posCount > negCount) return 0.7;
  return 0;
};

const computeTextScore = ({ finalEmotion, modelEmotion, message, confidence, riskLevel }) => {
  let base = emotionBaseScore(finalEmotion);

  if (base === 0) {
    base = emotionBaseScore(modelEmotion);
  }

  if (base === 0) {
    base = keywordSentimentScore(message);
  }

  if (base === 0 && String(message || "").trim()) {
    base = ["high", "medium"].includes(String(riskLevel || "").toLowerCase()) ? -0.4 : 0.25;
  }

  const parsedConfidence = clamp01(confidence);
  const effectiveConfidence = parsedConfidence > 0 ? parsedConfidence : 0.6;

  return Math.round(base * effectiveConfidence * 100) / 100;
};

const serializeSessionDetails = (session) => {
  const messages = (session.messages || []).map((m) => ({
    userMessage: decrypt(m.userMessage),
    aiResponse: m.aiResponse,
    textScore: m.textScore || 0,
    voiceScore: m.voiceScore || 0,
    faceScore: m.faceScore || 0,
    finalScore: m.finalScore || 0,
    emotion: m.emotion || "neutral",
    timestamp: m.timestamp,
  }));

  return {
    id: session._id,
    studentId: session.studentId,
    sessionDuration: session.sessionDuration,
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    finalMood: session.finalMood,
    finalScore: session.finalScore,
    riskLevel: session.riskLevel,
    averageTextScore: session.averageTextScore || 0,
    averageVoiceScore: session.averageVoiceScore || 0,
    averageFaceScore: session.averageFaceScore || 0,
    messagesCount: messages.length,
    messages,
  };
};
// controllers/session.js

export const sendMessage = async (req, res) => {
  try {
    const { sessionId, message, studentData } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ msg: "sessionId and message are required" });
    }

    // 1️⃣ Find session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }
    if (String(session.studentId) !== String(req.user.id)) {
      return res.status(403).json({ msg: "You are not allowed to access this session" });
    }

    // 2️⃣ Call AI Service (🔥 MAIN CHANGE)
    const aiResult = await getFinalAIResponse({
      message,
      studentData,
    });

    console.log("AI Result:", aiResult);

    if (!aiResult.success) {
      console.warn("AI processing degraded, continuing with fallback response");
    }

    const data = aiResult.data;

    // 3️⃣ Prepare scores (fallback safe)
    const textScore = computeTextScore({
      finalEmotion: data.finalEmotion,
      modelEmotion: data.modelEmotion,
      message,
      confidence: data.confidence,
      riskLevel: data.riskLevel,
    });
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
      riskLevel: data.riskLevel || toRiskLevel(finalScore),
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
    if (String(session.studentId) !== String(req.user.id)) {
      return res.status(403).json({ msg: "You are not allowed to access this session" });
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
        id: session._id,
        finalScore,
        finalMood,
        riskLevel,
        averageTextScore: avgText,
        averageVoiceScore: avgVoice,
        averageFaceScore: avgFace,
        messagesCount: msgs.length,
      },
      sessionDetails: serializeSessionDetails(session),
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

// Get full details of one session for report view
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (String(session.studentId) !== String(req.user.id)) {
      return res.status(403).json({ msg: "You are not allowed to access this session" });
    }

    return res.status(200).json({
      success: true,
      session: serializeSessionDetails(session),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getStudentSessionHistory = async (req, res) => {
  try {
    const sessions = await Session.find({ studentId: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    const history = sessions.map((session) => {
      const messages = session.messages || [];
      const lastMessage = messages.length ? messages[messages.length - 1] : null;

      const startedAtMs = session.startedAt ? new Date(session.startedAt).getTime() : NaN;
      const endedAtMs = session.endedAt ? new Date(session.endedAt).getTime() : NaN;

      const durationMinutes = Number.isFinite(startedAtMs) && Number.isFinite(endedAtMs)
        ? Math.max(1, Math.round((endedAtMs - startedAtMs) / (1000 * 60)))
        : session.sessionDuration || 0;

      return {
        id: session._id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        status: session.status || "active",
        sessionDuration: session.sessionDuration || durationMinutes,
        durationMinutes,
        finalMood: session.finalMood || "neutral",
        finalScore: session.finalScore || 0,
        riskLevel: session.riskLevel || "low",
        averageTextScore: session.averageTextScore || 0,
        averageVoiceScore: session.averageVoiceScore || 0,
        averageFaceScore: session.averageFaceScore || 0,
        messagesCount: messages.length,
        lastAiResponse: lastMessage?.aiResponse || "",
        lastStudentMessage: lastMessage?.userMessage ? decrypt(lastMessage.userMessage) : "",
      };
    });

    return res.status(200).json({
      success: true,
      sessions: history,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};