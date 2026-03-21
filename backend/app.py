
import sys
print("=== DÉMARRAGE ===", file=sys.stderr)
sys.stderr.flush()

try:
    from flask import Flask, request, jsonify
    print("✓ Flask importé", file=sys.stderr)
except Exception as e:
    print(f"❌ Erreur import Flask: {e}", file=sys.stderr)
    sys.exit(1)

try:
    from flask_sqlalchemy import SQLAlchemy
    print("✓ SQLAlchemy importé", file=sys.stderr)
except Exception as e:
    print(f"❌ Erreur import SQLAlchemy: {e}", file=sys.stderr)
    sys.exit(1)

# Continue pour tous les imports...

#--------------------------------------------------------------------
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'OK',
        'database': bool(os.getenv('DATABASE_URL'))
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
