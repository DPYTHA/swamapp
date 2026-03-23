# minimal_app.py
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'OK',
        'message': 'Minimal API is running',
        'port': os.getenv('PORT', '8080')
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)