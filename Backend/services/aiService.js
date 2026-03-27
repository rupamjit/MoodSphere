import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export const getFinalAIResponse = async ({
  message,
  studentData,
  imagePath // optional
}) => {
  try {
    // 🔹 1. TEXT Emotion Detection (existing)
    const textEmotionRes = await axios.post(
      "http://127.0.0.1:8000/predict",
      { text: message }
    );

    const textEmotionData = textEmotionRes.data[0];

    const textEmotion = textEmotionData.prediction;
    const textConfidence = textEmotionData.confidence;

    // 🔹 2. IMAGE Emotion Detection (NEW FEATURE 🔥)
    let imageEmotion = null;
    let imageConfidence = null;
    let imageScores = null;

    if (imagePath) {
      try {
        const form = new FormData();
        form.append("image", fs.createReadStream(imagePath));

        const imageRes = await axios.post(
          "http://127.0.0.1:6000/detect-emotion",
          form,
          { headers: form.getHeaders() }
        );

        imageEmotion = imageRes.data.dominant_emotion;
        imageConfidence = imageRes.data.confidence;
        imageScores = imageRes.data.emotion_scores;

      } catch (err) {
        console.log("Image Emotion Error:", err.message);
      }
    }

    // 🔥 3. Combine emotions (simple logic)
    const finalDetectedEmotion =
      imageEmotion || textEmotion; // prefer image if available

    const finalConfidence =
      imageConfidence || textConfidence;

    // 🔹 4. Call Chat API with BOTH emotions
    const chatRes = await axios.post(
      "http://127.0.0.1:6000/api/chat",
      {
        student_data: {
          ...studentData,
          text_emotion: textEmotion,
          text_confidence: textConfidence,
          image_emotion: imageEmotion,
          image_confidence: imageConfidence,
          final_emotion: finalDetectedEmotion,
        },
        message,
      },
      15000
    );

    let aiResponse = chatRes.data.data.response;

    // 🔥 5. Clean LLM JSON
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
        emotion: finalDetectedEmotion,
        risk_level: "unknown",
        response: aiResponse,
        action: "none",
      };
    }

    // 🔥 6. Final Response (IMPORTANT UPGRADE)
    return {
      success: true,
      data: {
        // 🎯 Final AI Output
        finalEmotion: parsed.emotion || finalDetectedEmotion,
        riskLevel: parsed.risk_level,
        reply: parsed.response,
        action: parsed.action,

        // 🧠 Emotion Breakdown (NEW FEATURE 🔥)
        emotions: {
          text: {
            emotion: textEmotion,
            confidence: textConfidence,
          },
          image: {
            emotion: imageEmotion,
            confidence: imageConfidence,
            scores: imageScores,
          },
          final: {
            emotion: finalDetectedEmotion,
            confidence: finalConfidence,
          }
        },

        // Debug
        studentContext: chatRes.data.data.student_context,
      },
    };

  } catch (error) {
    const errorMessage = error?.response?.data?.error || error?.message || "AI processing failed";
    console.error("AI Service Error:", errorMessage);

    return {
      success: true,
      data: {
        finalEmotion: "neutral",
        confidence: 0,
        riskLevel: "unknown",
        reply: "I'm sorry, I'm having trouble understanding right now. Can you tell me more?",
        action: "none",
        modelEmotion: "neutral",
        studentContext: studentData || {},
      },
      degraded: true,
      message: errorMessage,
    };
  }
};
