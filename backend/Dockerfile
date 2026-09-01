# RoadWatch AI — Backend Dockerfile
# Supports CPU inference. For GPU, use nvidia/cuda base image variant (see comments).

# ── CPU Build ────────────────────────────────────────────────────────────
FROM python:3.11-slim

# ── For GPU inference, replace above with: ──
# FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04
# RUN apt-get update && apt-get install -y python3 python3-pip && \
#     ln -s /usr/bin/python3 /usr/bin/python

# System dependencies (OpenCV needs libgl1, libglib)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories
RUN mkdir -p static/detections models/weights

# Expose port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
