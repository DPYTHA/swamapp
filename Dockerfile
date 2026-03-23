FROM python:3.11-slim

WORKDIR /app

# Copier les fichiers
COPY backend/ ./backend/
COPY requirements.txt .

# IMPORTANT
ENV PYTHONPATH=/app

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Exposer le port
EXPOSE 8080

# Commande de démarrage avec port fixe
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8080"]