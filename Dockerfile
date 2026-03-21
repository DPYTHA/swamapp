# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copier les fichiers
COPY backend/ ./backend/
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Créer un fichier pour que Railway sache que c'est un service web
EXPOSE 5000

# Démarrer l'application
CMD ["gunicorn", "--chdir", "backend", "--bind", "0.0.0.0:5000", "app:app"]