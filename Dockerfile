FROM python:3.11-slim

WORKDIR /app

# Copier les fichiers nécessaires (sans .env)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY backend/ ./backend/



# Définir le PYTHONPATH
ENV PYTHONPATH=/app

# Exposer le port
EXPOSE 8081

# Démarrer l'application
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8081", "--workers", "4", "--threads", "4"]