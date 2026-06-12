# TurtleTrack

> Sea Turtle Re-Identification and Conservation Platform

TurtleTrack is a mobile-first conservation platform that enables field researchers to identify individual sea turtles using computer vision. Researchers upload images from the field; the system matches them against known turtles using MobileNetV2 feature extraction and FAISS similarity search, then displays identification results with complete sighting history.

---

## Features

- **AI-Powered Identification** — MobileNetV2 + FAISS cosine similarity for turtle re-identification
- **Conservation History** — "Last recorded 12 years ago" — time-since-seen tracking
- **Sighting Management** — GPS coordinates, location, field notes
- **Admin Verification** — Pending approval workflow for new turtle discovery
- **Conservation Statistics** — Return rates, species breakdown, sighting trends
- **Mobile-First** — React Native Expo for iOS and Android

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native Expo + TypeScript + NativeWind |
| Backend API | Node.js + Express + TypeScript + MongoDB |
| ML Service | Python + FastAPI + PyTorch + FAISS |
| Storage | Local filesystem (S3-ready adapter) |

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start MongoDB (Docker recommended)
docker-compose up mongo -d

# 3. Install and start backend
cd backend-node && npm install && npm run dev

# 4. Install and start ML service
cd backend-ml
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt && python main.py

# 5. Install and start frontend
cd frontend && npm install && npx expo start
```

See [INSTALLATION.md](docs/INSTALLATION.md) for full setup instructions.

## Project Structure

```
TurtleTrack/
├── frontend/          # React Native Expo (iOS + Android)
├── backend-node/      # REST API (Node.js + Express)
├── backend-ml/        # ML Service (Python + FastAPI + FAISS)
├── uploads/           # Local image storage
└── docs/              # Documentation
```

## ML Pipeline

Turtle images → MobileNetV2 feature extraction → 1280-dim embedding → FAISS cosine similarity search → Match scoring → Identification result

Similarity thresholds:
- ≥ 85% → Strong match (auto-confirm)
- 65–85% → Probable match (human review)
- < 65% → New turtle (pending verification)

## Documentation

- [INSTALLATION.md](docs/INSTALLATION.md)
- [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
- [API_DOCUMENTATION.txt](docs/API_DOCUMENTATION.txt)
- [ML_PIPELINE.txt](docs/ML_PIPELINE.txt)
- [SETUP_GUIDE.txt](docs/SETUP_GUIDE.txt)

---

*Built for marine conservation research. Designed for field use.*
