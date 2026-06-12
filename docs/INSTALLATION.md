# TurtleTrack — Installation Guide

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Node.js | 20.x | Backend API |
| Python | 3.11 | ML Service |
| MongoDB | 7.0 | Database |
| Expo CLI | Latest | Mobile development |
| Docker | Optional | Easy MongoDB |

---

## Step 1 — Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd Turtle_Project

# Copy environment file
cp .env.example .env
```

Edit `.env` to configure:
- `MONGO_URI` — your MongoDB connection string
- `ML_SERVICE_URL` — Python service URL (default: `http://localhost:8000`)
- `UPLOAD_DIR` — path to the uploads folder (default: `../uploads`)

---

## Step 2 — Start MongoDB

### Option A: Docker (Recommended)
```bash
docker-compose up mongo -d
```

### Option B: Local MongoDB
Ensure MongoDB 7.0 is installed and running on port 27017.

---

## Step 3 — Backend Node API

```bash
cd backend-node

# Install dependencies
npm install

# Development mode (auto-reload)
npm run dev

# Production build
npm run build && npm start
```

The API will be available at `http://localhost:3000`

---

## Step 4 — Python ML Service

```bash
cd backend-ml

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python main.py
```

The ML service will be available at:
- API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

> **Note:** The first startup downloads the MobileNetV2 model weights (~14MB from PyTorch Hub). Subsequent startups are instant.

---

## Step 5 — Frontend (React Native Expo)

```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with:
- **iOS**: Camera app or Expo Go
- **Android**: Expo Go app

### Update API URL
Before running on a physical device, update `src/constants/theme.ts`:
```typescript
// Replace localhost with your computer's local IP
export const API_BASE_URL = 'http://192.168.x.x:3000/api';
export const UPLOADS_BASE_URL = 'http://192.168.x.x:3000';
```

---

## Step 6 — Docker (Full Stack)

```bash
# Start all services
docker-compose up --build

# Background mode
docker-compose up -d --build
```

Services:
- MongoDB: `localhost:27017`
- Node API: `localhost:3000`
- ML Service: `localhost:8000`

---

## Verify Installation

```bash
# Check Node API health
curl http://localhost:3000/api/health

# Check ML service health
curl http://localhost:8000/ml/health

# Check ML service docs
open http://localhost:8000/docs
```

Expected responses:
```json
// Node API
{ "success": true, "data": { "status": "operational", "services": { "database": "connected", "ml": "connected" } } }

// ML Service
{ "status": "operational", "model_loaded": true, "index_size": 0 }
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| MongoDB connection refused | Ensure MongoDB is running on port 27017 |
| ML service not connecting | Check `ML_SERVICE_URL` in `.env` |
| Image upload failing | Verify `uploads/` directory is writable |
| PyTorch model download slow | First startup downloads ~14MB model; wait |
| Expo QR code not working | Use your machine's local IP, not `localhost` |
| FAISS install error | `pip install faiss-cpu` (not `faiss-gpu`) |
