from flask import Blueprint, request, jsonify
from services.session_service import get_ai_response
from utils.formatter import build_student_context

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json

        # 🔹 Get from body
        student_data = data.get("student_data")
        message = data.get("message")

        if not student_data or not message:
            return jsonify({"error": "student_data and message required"}), 400

        print("📥 Incoming student_data:", student_data)

        # 🔹 Build context
        context = build_student_context(student_data)

        # 🔹 AI response
        response = get_ai_response(context, message)

        return jsonify({
            "success": True,
            "data": {
                "response": response,
                "student_context": student_data
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500