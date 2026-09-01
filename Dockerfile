FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

ENV PYTHONPATH=/app

# Utiliser le port 5000 (port par défaut de Railway)
EXPOSE 5000

# Démarrer l'application sur le port 5000
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "4"]