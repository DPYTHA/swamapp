FROM python:3.11-slim

WORKDIR /app

# Copier tout le dossier backend
COPY backend/ ./backend/
COPY requirements.txt .
COPY .env .

RUN pip install --no-cache-dir -r requirements.txt

# ✅ Utiliser backend.app:app
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8081", "--workers", "4", "--threads", "4"]