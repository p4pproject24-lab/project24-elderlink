# Whisper Speech-to-Text Service Dockerfile
FROM python:3.11-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user for security
RUN groupadd -r whisper && useradd -r -g whisper whisper

# Create and set ownership of home directory and cache directories
RUN mkdir -p /home/whisper/.cache/whisper && \
    chown -R whisper:whisper /home/whisper

# Copy application code and set ownership
COPY --chown=whisper:whisper . .

USER whisper

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["uvicorn", "whisper_api:app", "--host", "0.0.0.0", "--port", "8001"]
