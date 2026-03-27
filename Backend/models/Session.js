import mongoose from "mongoose";


//  Each message inside session
const messageSchema = new mongoose.Schema({
  userMessage: {
    type: String,
    required: true,
  },
  aiResponse: {
    type: String,
  },
  // 🧠 Model Outputs
  textScore: {
    type: Number,
    default: 0,
  },
  voiceScore: {
    type: Number,
    default: 0,
  },
  faceScore: {
    type: Number,
    default: 0,
  },
  finalScore: {
    type: Number,
    default: 0,
  },
  emotion: {
    type: String,
    default: "neutral",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});


// 🔹 Main Session Schema
const sessionSchema = new mongoose.Schema(
  {
    // 👤 Student reference
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // ⏱️ Session Info
    sessionDuration: {
      type: Number, // 5 / 10 / 15 minutes
      enum: [5, 10, 15],
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },

    // 💬 All Messages
    messages: [messageSchema],

    // 🧠 Final Output (after session ends)
    finalMood: {
      type: String,
      default: "neutral",
    },

    finalScore: {
      type: Number,
      default: 0,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    // 📊 Aggregated Info
    averageTextScore: Number,
    averageVoiceScore: Number,
    averageFaceScore: Number,

    // ⏰ Time Tracking
    startedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Session || mongoose.model("Session", sessionSchema);