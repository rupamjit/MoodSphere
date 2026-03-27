import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    story: {
      type: String,
      required: true
    },

    key_learnings: {
      type: [String], // array of strings
      required: true
    },

    final_message: {
      type: String,
      required: true
    },

    improvement: {
      type: Boolean,
      required: true
    },

    action: {
      type: String,
      enum: ["create_blog", "skip"],
      required: true
    },

    summary: {
      type: String // store generated summary (optional but useful)
    },

    // 🔥 Extra (recommended for real app)
    student_id: {
      type: String
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // adds createdAt & updatedAt automatically
  }
);

export default mongoose.model("Blog", blogSchema);