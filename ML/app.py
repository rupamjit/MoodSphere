from flask import Flask, request, jsonify
import numpy as np
import pickle
from tensorflow.keras.models import load_model

app = Flask(__name__)

# ==============================
# 🔹 Load trained assets
# ==============================
model = load_model("data/my_model.h5")

with open("data/encoder.pkl", "rb") as f:
    encoder = pickle.load(f)

with open("data/countVectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

# ==============================
# 🔹 Home route
# ==============================
@app.route("/")
def home():
    return "Emotion API running 🚀"

# ==============================
# 🔹 Prediction route
# ==============================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # 🔥 Accept both single text & list
        text_input = data["text"]

        if isinstance(text_input, str):
            texts = [text_input]
        else:
            texts = text_input  # list of texts

        # ==============================
        # 🔹 SAME preprocessing as training
        # ==============================
        text_vectors = vectorizer.transform(texts).toarray()

        # ==============================
        # 🔹 Prediction
        # ==============================
        predictions = model.predict(text_vectors)

        predicted_classes = np.argmax(predictions, axis=1)
        labels = encoder.inverse_transform(predicted_classes)

        # ==============================
        # 🔹 Build response
        # ==============================
        results = []
        for i in range(len(texts)):
            results.append({
                "input": texts[i],
                "prediction": labels[i],
                "confidence": float(np.max(predictions[i]))
            })

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)})

# ==============================
# 🔹 Run server
# ==============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)