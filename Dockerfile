FROM python:3.11-slim

WORKDIR /app

COPY backend/ ./backend/
COPY requirements.txt .

ENV PYTHONPATH=/app

RUN pip install --no-cache-dir -r requirements.txt

# Force le port 8081
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8081"]