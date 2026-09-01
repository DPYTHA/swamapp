FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

ENV PYTHONPATH=/app

EXPOSE 8081

CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8081", "--workers", "4", "--threads", "4"]