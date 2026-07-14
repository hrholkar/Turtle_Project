# TurtleTrack — Windows Installation Guide

Complete from-scratch setup on a fresh Windows machine.

---

## 1. Install Node.js 22 LTS

1. Download from: https://nodejs.org/en/download/  
2. Choose **Windows Installer (.msi)** → LTS version (22.x)
3. Run installer with default options (includes npm)
4. Verify:
   ```powershell
   node --version    # v22.x.x
   npm --version     # 10.x.x
   ```

---

## 2. Install Python 3.13

> **Critical**: torch 2.6.0 requires **exactly Python 3.13**. Do NOT use 3.11 or 3.12.

1. Download from: https://python.org/downloads/  
2. Select **Python 3.13.x — Windows installer (64-bit)**
3. ✅ Check **"Add python.exe to PATH"** during installation
4. Verify:
   ```powershell
   python --version    # Python 3.13.x
   pip --version       # pip 26.x.x from Python 3.13
   ```

---

## 3. Install MongoDB Community Edition 7

1. Download from: https://mongodb.com/try/download/community  
2. Choose: **Version 7.0** → **Platform: Windows** → **Package: msi**
3. Run installer:
   - Select **Complete** installation type
   - ✅ Check **"Install MongoD as a Service"**
   - ✅ Check **"Install MongoDB Compass"** (optional, but useful GUI)
4. Verify MongoDB service is running:
   ```powershell
   Get-Service -Name "MongoDB"
   # Should show: Running
   ```
5. Test connection:
   ```powershell
   # Install mongosh if not included
   # Download from: https://mongodb.com/try/download/shell
   mongosh
   # Should connect to localhost:27017
   ```

---

## 4. Install Git

1. Download from: https://git-scm.com/download/win
2. Install with default options

---

## 5. Install Expo CLI (for frontend)

```powershell
npm install -g expo-cli
```

---

## 6. Clone the Repository

```powershell
git clone <repository-url>
cd Turtle_Project
```

---

## 7. Configure Environment Variables

The `.env` file has already been created for you. Verify it exists:
```powershell
Test-Path ".env"  # Should print: True
```

If not, copy from template:
```powershell
Copy-Item ".env.example" ".env"
```

---

## 8. Install Node Backend

```powershell
cd backend-node
npm install
cd ..
```

---

## 9. Set Up Python ML Environment

```powershell
cd backend-ml

# Create virtual environment
python -m venv .venv

# Fix PowerShell execution policy (run once on your machine)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Activate venv
.\.venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install ML packages (~2.5 GB download — may take 10-20 min on first install)
pip install -r requirements.txt

# Verify installation
python -c "import torch; print('torch:', torch.__version__)"
python -c "import torchvision; print('torchvision:', torchvision.__version__)"
python -c "import faiss; print('faiss: ok')"
python -c "import fastapi; print('fastapi:', fastapi.__version__)"

cd ..
```

---

## 10. Install Frontend

```powershell
cd frontend
npm install
cd ..
```

---

## 11. Install Expo Go on Your Phone

- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent  
- **iOS**: https://apps.apple.com/app/expo-go/id982107779

---

## 12. Start All Services

Open **4 PowerShell terminals** (or Windows Terminal tabs):

### Terminal 1 — MongoDB
```powershell
# Start if not already running as a service
net start MongoDB
```

### Terminal 2 — Node Backend
```powershell
cd "e:\Personal All\MIT AOE\PROJECTS\Sea_Turtle\Turtle_Project\backend-node"
npm run dev
```

### Terminal 3 — ML Service
```powershell
cd "e:\Personal All\MIT AOE\PROJECTS\Sea_Turtle\Turtle_Project\backend-ml"
.\.venv\Scripts\Activate.ps1
python main.py
```

### Terminal 4 — Frontend
```powershell
cd "e:\Personal All\MIT AOE\PROJECTS\Sea_Turtle\Turtle_Project\frontend"
npx expo start
```

---

## 13. Find Your Local IP (for physical device)

```powershell
ipconfig | Select-String "IPv4"
```

Update `frontend/src/constants/theme.ts`:
```typescript
export const API_BASE_URL = 'http://YOUR_IP_HERE:3000/api';
```

---

## Firewall Rules (if phone can't connect)

```powershell
# Allow port 3000 (Node API) — run as Administrator
netsh advfirewall firewall add rule name="TurtleTrack-API" dir=in action=allow protocol=TCP localport=3000

# Allow port 8000 (ML Service) — run as Administrator
netsh advfirewall firewall add rule name="TurtleTrack-ML" dir=in action=allow protocol=TCP localport=8000
```

---

## Verification Checklist

After all services are running, open these URLs in your browser:

| URL | Expected Response |
|-----|------------------|
| http://localhost:3000/api/health | `{"success": true, "data": {"status": "operational"}}` |
| http://localhost:8000/ | `{"service": "TurtleTrack ML Service"}` |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/ml/health | `{"status": "operational", "model_loaded": true}` |

---

## Common Windows Issues

### Python not found after install
```powershell
# Restart PowerShell after installing Python
# Or manually add to PATH:
$env:PATH += ";C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python313"
```

### Venv activation blocked
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### MongoDB not installed as a service
```powershell
# Install manually as service (run as Admin)
sc create MongoDB binPath="\"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe\" --service --config=\"C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg\"" DisplayName="MongoDB" start=auto
net start MongoDB
```

### Port already in use
```powershell
# Find process using port 3000
netstat -ano | Select-String ":3000"
# Kill it (replace <PID> with the found process ID)
Stop-Process -Id <PID> -Force
```
