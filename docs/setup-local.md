# TurtleTrack — Local Development Setup

> **Stack**: Node.js 22 · Python 3.13 · MongoDB 7 · Expo (React Native)  
> **OS**: Windows (PowerShell 5.1+)

---

## Prerequisites

| Tool | Required Version | Install Source |
|------|-----------------|----------------|
| Node.js | ≥ 20 (22 LTS recommended) | https://nodejs.org |
| Python | **3.13.x** | https://python.org |
| MongoDB | ≥ 7.0 | https://mongodb.com/try/download/community |
| Git | Any | https://git-scm.com |
| Expo Go (mobile) | Latest | App Store / Play Store |

---

## Step 1 — Clone & Verify Environment

```powershell
# Verify tool versions
node --version     # should print v22.x.x
python --version   # MUST be 3.13.x
npm --version      # should print 10.x.x
```

---

## Step 2 — Start MongoDB

### Option A: MongoDB installed as a Windows Service (recommended)
```powershell
# Start the MongoDB service
net start MongoDB

# Verify it's running
mongosh --eval "db.adminCommand('ping')"
```

### Option B: Run mongod manually
```powershell
# Create data directory if needed
New-Item -ItemType Directory -Force "C:\data\db"

# Start mongod in background
Start-Process mongod -ArgumentList "--dbpath C:\data\db" -WindowStyle Minimized
```

> **Connection string**: `mongodb://localhost:27017/turtletrack`

---

## Step 3 — Set Up Node Backend

```powershell
# Navigate to backend-node
cd backend-node

# Install dependencies
npm install

# Verify TypeScript compiles without errors
npx tsc --noEmit

# Start development server
npm run dev
```

Expected output:
```
╔════════════════════════════════════════╗
║        TurtleTrack API Server          ║
╠════════════════════════════════════════╣
║  Port    : 3000                        ║
║  Env     : development                 ║
║  MongoDB : mongodb://localhost:27017...║
╚════════════════════════════════════════╝
```

---

## Step 4 — Set Up Python ML Service

```powershell
# Navigate to backend-ml
cd ..\backend-ml

# Create virtual environment (Python 3.13 REQUIRED)
python -m venv .venv

# Activate venv
.\.venv\Scripts\Activate.ps1

# If activation is blocked by execution policy, run once:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Upgrade pip first (important for torch 2.6.0+ wheel support)
python -m pip install --upgrade pip

# Install all dependencies (this downloads ~2.5GB — allow 5-15 min)
pip install -r requirements.txt

# Verify torch works
python -c "import torch; print('PyTorch:', torch.__version__)"
python -c "import faiss; print('FAISS: OK')"

# Start ML service
python main.py
```

Expected output:
```
[ML] Loading MobileNetV2 feature extractor...
[ML] FeatureExtractor initialized on cpu — dim=1280
[ML] Loading FAISS index...
[ML] FAISS index loaded — 0 turtles indexed
[ML] ✓ ML Service ready

INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 5 — Set Up Frontend

```powershell
# Navigate to frontend
cd ..\frontend

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

For web browser preview:
```powershell
npx expo start --web
```

---

## Step 6 — Configure API URL

The frontend connects to `http://localhost:3000/api` by default.

Edit [`frontend/src/constants/theme.ts`](../frontend/src/constants/theme.ts):

```typescript
// For Android emulator — use 10.0.2.2 instead of localhost
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

// For iOS simulator — localhost works
export const API_BASE_URL = 'http://localhost:3000/api';

// For physical device — use your machine's LAN IP
export const API_BASE_URL = 'http://192.168.x.x:3000/api';
```

---

## Quick Start (All Services)

Open **3 PowerShell windows** and run one command in each:

| Window | Command | Directory |
|--------|---------|-----------|
| 1 | `net start MongoDB` | anywhere |
| 2 | `npm run dev` | `backend-node/` |
| 3 | `.\.venv\Scripts\Activate.ps1; python main.py` | `backend-ml/` |
| 4 | `npx expo start` | `frontend/` |

Or use the included startup script:
```powershell
# From project root
.\start-dev.ps1
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Node API | http://localhost:3000 |
| API Health | http://localhost:3000/api/health |
| ML Service | http://localhost:8000 |
| ML Docs (Swagger) | http://localhost:8000/docs |
| MongoDB | mongodb://localhost:27017/turtletrack |

---

## Troubleshooting

### "Cannot connect to MongoDB"
```powershell
# Check if MongoDB service exists
Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue

# Check if mongod process is running
Get-Process -Name "mongod" -ErrorAction SilentlyContinue

# Manually start
net start MongoDB
```

### "torch cannot be installed"
Make sure you're using **Python 3.13** (not 3.11, 3.12, etc.):
```powershell
python --version  # MUST say 3.13.x
# If wrong: install Python 3.13 from python.org, then recreate venv
```

### "faiss-cpu install fails"
Use the correct post-release version:
```powershell
pip install faiss-cpu==1.9.0.post1
```

### "Module not found" for `nativewind`
```powershell
cd frontend
npm install
npx expo start --clear
```

### "Execution policy" error for venv activation
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
