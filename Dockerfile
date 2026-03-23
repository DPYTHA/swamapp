FROM python:3.11-slim

WORKDIR /app

# Copier les fichiers
COPY backend/ ./backend/
COPY requirements.txt .

# IMPORTANT
ENV PYTHONPATH=/app

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Exposer le port (doit correspondre au bind)
EXPOSE 5000

# Commande de démarrage
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:5000"]