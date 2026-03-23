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
        'database_url_exists': bool(os.getenv('DATABASE_URL'))
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)