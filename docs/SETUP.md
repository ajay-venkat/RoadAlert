# RoadWatch AI — Setup Guide

## Prerequisites

- **Python 3.10+** — Backend
- **Node.js 18+** — Dashboard & Mobile
- **MongoDB** — Local or [Atlas free tier](https://www.mongodb.com/cloud/atlas)
- **npm** — Package manager

---

## 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux

# Edit .env — set your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017
# or
# MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/

# Create directories
mkdir -p static/detections models/weights

# (Optional) Seed demo data
python scripts/seed_data.py

# Start the server
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at **http://localhost:8000** with interactive docs at **http://localhost:8000/docs**.

### GPU Setup (Optional)

If you have an NVIDIA GPU:

```bash
# Install PyTorch with CUDA
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# The YOLOv8 service will auto-detect the GPU
```

### Training Your Own Model

```bash
cd backend

# Download a dataset (e.g., from Kaggle) and organize it in YOLO format:
# dataset/
#   train/images/ + train/labels/
#   val/images/ + val/labels/

# Run the training script
python scripts/train.py

# The best weights will be saved to models/weights/best.pt
```

---

## 2. Dashboard Setup

```bash
cd dashboard

# Install dependencies
npm install --legacy-peer-deps

# Set the API URL (optional — defaults to http://localhost:8000)
# Create .env.local:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Dashboard available at **http://localhost:3000**.

---

## 3. Mobile App Setup

```bash
cd mobile-app

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with **Expo Go** on your phone. Update the API URL in the Settings tab to point to your backend server's IP address (e.g., `http://192.168.1.100:8000`).

### Building for Production

```bash
# Android APK
npx expo build:android

# iOS (requires macOS)
npx expo build:ios
```

---

## 4. MongoDB Setup

### Option A: Local MongoDB

1. [Download MongoDB Community](https://www.mongodb.com/try/download/community)
2. Start the service: `mongod`
3. Default URI: `mongodb://localhost:27017`

### Option B: MongoDB Atlas (Free Tier)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Get connection string from "Connect" → "Connect your application"
4. Set `MONGODB_URI` in your `.env` file

---

## Docker Deployment

```bash
cd backend

# Build
docker build -t roadwatch-backend .

# Run
docker run -p 8000:8000 -e MONGODB_URI=mongodb://host.docker.internal:27017 roadwatch-backend
```

For GPU support:
```bash
docker run --gpus all -p 8000:8000 -e MONGODB_URI=... roadwatch-backend
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `DB_NAME` | `roadwatch` | Database name |
| `MODEL_PATH` | `models/weights/best.pt` | Path to fine-tuned YOLO weights |
| `FALLBACK_MODEL` | `yolov8s.pt` | Fallback model if fine-tuned not found |
| `CONFIDENCE_THRESHOLD` | `0.25` | Minimum detection confidence |
| `UPLOAD_DIR` | `static/detections` | Image storage directory |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL (dashboard) |
