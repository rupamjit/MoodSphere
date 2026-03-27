import axios from "axios";
import Blog from "../models/Blog.js";
import Session from "../models/Session.js";
import CryptoJS from "crypto-js";

// 🔐 Decrypt function
const decrypt = (text) => {
  try {
    // 🔥 If already plain text → return directly
    if (!text || !text.startsWith("U2FsdGVkX1")) {
      return text;
    }

    const bytes = CryptoJS.AES.decrypt(text, process.env.SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    return decrypted || text;
  } catch {
    return text;
  }
};

export const generateAndSaveBlog = async (req, res) => {
  try {
    const { sessions_id, student_id } = req.body;

    if (!sessions_id || sessions_id.length === 0) {
      return res.status(400).json({ error: "Sessions are required" });
    }

    // 🔥 1. Fetch sessions
    const dbSessions = await Session.find({
      _id: { $in: sessions_id },
    });

    if (!dbSessions.length) {
      return res.status(404).json({ error: "No sessions found" });
    }

    // 🔥 2. Convert DB → Flask format
    let sessions = [];

    dbSessions.forEach((session) => {
      const messages = session.messages;

      for (let i = 0; i < messages.length - 1; i++) {
        const current = messages[i];
        const next = messages[i + 1];

        // 🔓 Decrypt messages
        const input = decrypt(current.userMessage);
        const response = decrypt(current.aiResponse);

        // ⚠️ Skip empty
        if (!input || !response) continue;

        sessions.push({
          input,
          response,
          mood_before: current.finalScore || 0,
          mood_after: next.finalScore || current.finalScore || 0,
        });
      }
    });

    if (sessions.length === 0) {
      return res.status(400).json({
        error: "No valid session data after decryption",
      });
    }

    console.log("Sessions to send to Flask:", sessions);

    // 🔥 3. Call Flask API
    const flaskRes = await axios.post(
      "http://127.0.0.1:5000/api/generate-blog",
      { sessions }
    );

    let { blog, summary } = flaskRes.data;

    // 🔥 CASE 1: Gemini returned wrapped JSON
    if (blog?.raw_output) {
    let content = blog.raw_output.trim();

    // remove markdown
    if (content.startsWith("```")) {
        content = content.replace("```json", "").replace(/```/g, "").trim();
    }

    try {
        blog = JSON.parse(content); // ✅ NOW REAL BLOG
    } catch (e) {
        return res.status(500).json({
        error: "Failed to parse AI response",
        raw: content
        });
    }
    }
    
    // ✅ SKIP
    if (blog?.action === "skip") {
    return res.json({
        message: "No meaningful improvement → Blog skipped"
    });
    }

    // ❌ REAL error only
    if (!blog || blog.action === "error") {
    return res.status(500).json({
        error: "Blog generation failed",
        raw: blog
    });
    }

    // 🔥 4. Save blog
    const newBlog = new Blog({
      title: blog.title,
      story: blog.story,
      key_learnings: blog.key_learnings,
      final_message: blog.final_message,
      improvement: blog.improvement,
      action: blog.action,
      summary,
      student_id,
    });

    await newBlog.save();

    // ✅ Response
    res.json({
      message: "Blog generated & saved successfully",
      data: newBlog,
    });

  } catch (error) {
    console.error("Controller Error:", error.message);

    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};