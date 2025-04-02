FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything from the backend folder
COPY backend/ .

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Expose default port (for docs only)
EXPOSE 5000

# Correct CMD with shell expansion
CMD bash -c "exec gunicorn --bind 0.0.0.0:${PORT:-5000} app:app"