FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

ENV PYTHONPATH=/app

EXPOSE ${PORT:-8081}

CMD ["sh", "-c", "gunicorn backend.app:app --bind 0.0.0.0:${PORT:-8081} --workers 4 --threads 4"]