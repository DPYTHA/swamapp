FROM python:3.11-slim

WORKDIR /app

# Copier requirements.txt depuis le dossier backend
COPY backend/requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY backend/ ./backend/

# Définir le PYTHONPATH
ENV PYTHONPATH=/app

# Exposer le port
EXPOSE 8081

# Démarrer l'application
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8081", "--workers", "4", "--threads", "4"]