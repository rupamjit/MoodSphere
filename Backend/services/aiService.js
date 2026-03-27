// services/aiService.js

import axios from "axios";

export const getFinalAIResponse = async ({ message, studentData }) => {
  try {
    // 🔹 1. Call Emotion Detection API
    const emotionRes = await axios.post(
      "http://127.0.0.1:8000/predict",
      { text: message }
    );

    const emotionData = emotionRes.data[0];

    // Extract values
    const detectedEmotion = emotionData.prediction;
    const confidence = emotionData.confidence;

    // 🔹 2. Call Chat API with enhanced data
    const chatRes = await axios.post(
      "http://127.0.0.1:5000/api/chat",
      {
        student_data: {
          ...studentData,
          detected_emotion: detectedEmotion,
          confidence: confidence,
        },
        message,
      }
    );

    let aiResponse = chatRes.data.data.response;

    // 🔥 3. Clean LLM JSON (remove ```json block)
    if (aiResponse.includes("```")) {
      aiResponse = aiResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (err) {
      parsed = {
        emotion: detectedEmotion,
        risk_level: "unknown",
        response: aiResponse,
        action: "none",
      };
    }

    // 🔥 4. Final Combined Output
    return {
      success: true,
      data: {
        finalEmotion: parsed.emotion || detectedEmotion,
        confidence,
        riskLevel: parsed.risk_level,
        reply: parsed.response,
        action: parsed.action,

        // Debug / analytics
        modelEmotion: detectedEmotion,
        studentContext: chatRes.data.data.student_context,
      },
    };

  } catch (error) {
    console.error("AI Service Error:", error.message);

    return {
      success: false,
      message: "AI processing failed",
    };
  }
};