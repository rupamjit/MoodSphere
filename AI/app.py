from flask import Flask, jsonify, request
from routes.session_routes import chat_bp
from routes.blog_router import blog_bp
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


if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5000, debug=True)

