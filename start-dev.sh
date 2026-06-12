#!/bin/bash
# TurtleTrack Development Startup Script (Bash)
# Usage: ./start-dev.sh

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "\033[0;36m  TurtleTrack — Sea Turtle Re-Identification Platform\033[0m"
echo -e "\033[0;90m  ─────────────────────────────────────────────────────\033[0m"
echo ""

# 1. Check MongoDB
echo -e "\033[0;33m[1/3] Checking MongoDB...\033[0m"
if pgrep -x "mongod" > /dev/null; then
    echo -e "\033[0;32m      MongoDB is running ✓\033[0m"
else
    echo -e "\033[0;31m      MongoDB not running. Start with: docker-compose up mongo -d\033[0m"
fi

# 2. Start ML Service
echo -e "\033[0;33m[2/3] Starting Python ML Service (port 8000)...\033[0m"
cd "$ROOT_DIR/backend-ml"
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
python main.py &
ML_PID=$!
echo -e "\033[0;32m      ML Service starting (PID: $ML_PID) ✓\033[0m"

# 3. Start Node Backend
echo -e "\033[0;33m[3/3] Starting Node Backend (port 3000)...\033[0m"
cd "$ROOT_DIR/backend-node"
npm run dev &
NODE_PID=$!
echo -e "\033[0;32m      Node Backend starting (PID: $NODE_PID) ✓\033[0m"

echo ""
echo -e "\033[0;36m  Services:\033[0m"
echo "  ├─ Node Backend  → http://localhost:3000"
echo "  ├─ ML Service    → http://localhost:8000"
echo "  ├─ API Docs      → http://localhost:8000/docs"
echo "  └─ MongoDB       → mongodb://localhost:27017/turtletrack"
echo ""
echo "  Frontend: cd frontend && npx expo start"
echo ""

# Wait for all background jobs
wait $ML_PID $NODE_PID
