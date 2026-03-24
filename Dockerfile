FROM python:3.11-slim

WORKDIR /app

COPY backend/ ./backend/
COPY requirements.txt .

ENV PYTHONPATH=/app

RUN pip install --no-cache-dir -r requirements.txt

# Utilise le port fourni par Railway
CMD ["sh", "-c", "gunicorn backend.app:app --bind 0.0.0.0:${PORT:-5000}"]
