from flask import Flask, jsonify, request
from routes.session_routes import chat_bp
from routes.blog_router import blog_bp
import joblib
import numpy as np
from fer import FER
import cv2
import uuid
import os

app = Flask(__name__)

app.register_blueprint(chat_bp, url_prefix='/api')  # Register the chat blueprint with a prefix
app.register_blueprint(blog_bp, url_prefix='/api')  # Register the blog blueprint with a prefix

@app.get('/')
def index():
	return jsonify(message="Hello from MoodSphere AI (Flask)"), 200


@app.get('/health')
def health():
	return 'OK', 200


@app.post('/echo')
def echo():
	data = request.get_json(silent=True)
	return jsonify(received=data or {}), 200


# ✅ Load model
model = joblib.load("data/mood_model.pkl")


# =========================
# 🧠 Helper Functions
# =========================

def count_happy_days(mood):
    return sum([1 for x in mood if x > 0.7])


def estimate_future_mood(mood):
    avg = np.mean(mood)
    trend = mood[-1] - mood[0]

    future = avg + trend * 0.5
    return float(np.clip(future, 0, 1))


def get_risk_label(pred):
    return ["LOW", "MEDIUM", "HIGH"][pred]


def mood_label(score):
    if score < 0.3:
        return "LOW"
    elif score < 0.6:
        return "MODERATE"
    else:
        return "GOOD"


def predict_future_happy_days(future_mood):
    return int(np.clip(round(future_mood * 7), 0, 7))


# 🔥 Rule-based safety filter
def rule_based_filter(mood):
    avg = np.mean(mood)
    trend = mood[-1] - mood[0]

    if avg < 0.25 and trend < -0.2:
        return "HIGH"
    if avg > 0.75 and trend > 0:
        return "LOW"

    return None


# =========================
# 🚀 API Route
# =========================

@app.route("/predict-risk", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data or "mood" not in data:
            return jsonify({"error": "Missing 'mood' field"}), 400

        mood = data["mood"]

        # ✅ Validate input
        if not isinstance(mood, list) or len(mood) != 7:
            return jsonify({"error": "Mood must be a list of 7 values"}), 400

        if not all(isinstance(x, (int, float)) for x in mood):
            return jsonify({"error": "All mood values must be numbers"}), 400

        if not all(0 <= x <= 1 for x in mood):
            return jsonify({"error": "Mood values must be between 0 and 1"}), 400

        mood_array = np.array(mood).reshape(1, -1)

        # 🔥 Rule-based override
        rule = rule_based_filter(mood)

        # 🤖 Model prediction
        pred = model.predict(mood_array)[0]

        # 🔥 Confidence score
        if hasattr(model, "predict_proba"):
            confidence = float(np.max(model.predict_proba(mood_array)))
        else:
            confidence = None

        final_risk = rule if rule else get_risk_label(pred)

        # 🔮 Future mood
        future_mood = estimate_future_mood(mood)

        # 😊 Happy days (past + future)
        happy_days = count_happy_days(mood)
        future_happy_days = predict_future_happy_days(future_mood)

        return jsonify({
            "risk": final_risk,
            "confidence": round(confidence, 2) if confidence else None,
            "predicted_future_mood": round(future_mood, 2),
            "future_mood_label": mood_label(future_mood),
            "happy_days_last_7": happy_days,
            "future_happy_days": future_happy_days
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# 📁 Upload folder
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 🔥 Load model ONCE (important for performance)
detector = FER(mtcnn=True)


@app.route("/detect-emotion", methods=["POST"])
def detect_emotion():
    try:
        # 🔍 1. Validate request
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"error": "Empty file"}), 400

        # 🔥 2. Save image with unique name
        filename = str(uuid.uuid4()) + ".jpg"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        # 🔥 3. Read image
        img = cv2.imread(file_path)

        if img is None:
            return jsonify({"error": "Invalid image format"}), 400

        # 🔥 4. Detect emotions
        results = detector.detect_emotions(img)

        # 🔥 5. Handle no face detected
        if not results:
            os.remove(file_path)
            return jsonify({
                "message": "No face detected",
                "dominant_emotion": None,
                "emotion_scores": {}
            })

        # 🔥 6. Take first face (you can extend later)
        emotions = results[0]["emotions"]

        # 🔥 7. Get dominant emotion
        dominant_emotion = max(emotions, key=emotions.get)

        # 🔥 8. Confidence score
        confidence = emotions[dominant_emotion]

        # 🧹 9. Delete image after processing
        os.remove(file_path)

        # ✅ 10. Response
        return jsonify({
            "dominant_emotion": dominant_emotion,
            "confidence": round(confidence, 3),
            "emotion_scores": emotions
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# =========================
# 🟢 Run Server
# =========================

if __name__ == '__main__':
	app.run(host='0.0.0.0', port=6000, debug=True)

