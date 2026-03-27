from flask import Blueprint, request, jsonify
from services.summarizer_service import generate_final_summary
from services.blog_service import generate_blog

blog_bp = Blueprint("blog", __name__)


@blog_bp.route("/generate-blog", methods=["POST"])
def create_blog():
    try:
        data = request.json

        sessions = data.get("sessions")

        if not sessions:
            return jsonify({"error": "Sessions required"}), 400

        # Step 1: Generate summary
        final_summary = generate_final_summary(sessions)

        # Step 2: Generate blog
        blog = generate_blog(final_summary)

        return jsonify({
            "summary": final_summary,
            "blog": blog
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500