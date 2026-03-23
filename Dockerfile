FROM python:3.11-slim

WORKDIR /app

# Copier les fichiers
COPY backend/ ./backend/
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Railway utilise un port dynamique
ENV PORT=8080

EXPOSE 8080

# Démarrer avec le bon port
CMD ["sh", "-c", "gunicorn --chdir backend --bind 0.0.0.0:$PORT app:app"]