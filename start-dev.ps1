# TurtleTrack Development Startup Script (PowerShell)
# Usage: .\start-dev.ps1

param(
    [switch]$ML,
    [switch]$Backend,
    [switch]$All
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "  ████████╗██╗   ██╗██████╗ ████████╗██╗     ███████╗" -ForegroundColor Cyan
Write-Host "     ██╔══╝██║   ██║██╔══██╗╚══██╔══╝██║     ██╔════╝" -ForegroundColor Cyan
Write-Host "     ██║   ██║   ██║██████╔╝   ██║   ██║     █████╗  " -ForegroundColor Cyan
Write-Host "     ██║   ██║   ██║██╔══██╗   ██║   ██║     ██╔══╝  " -ForegroundColor Cyan
Write-Host "     ██║   ╚██████╔╝██║  ██║   ██║   ███████╗███████╗" -ForegroundColor Cyan
Write-Host "     ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  TurtleTrack — Sea Turtle Re-Identification Platform" -ForegroundColor Green
Write-Host "  ─────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

function Start-MongoDB {
    Write-Host "[1/3] Checking MongoDB..." -ForegroundColor Yellow
    $mongoRunning = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
    if (-not $mongoRunning) {
        Write-Host "      MongoDB not running. Start it manually or use docker-compose." -ForegroundColor Red
        Write-Host "      Run: docker-compose up mongo -d" -ForegroundColor Gray
    } else {
        Write-Host "      MongoDB is running ✓" -ForegroundColor Green
    }
}

function Start-MLService {
    Write-Host "[2/3] Starting Python ML Service (port 8000)..." -ForegroundColor Yellow
    $mlPath = Join-Path $root "backend-ml"
    if (-not (Test-Path $mlPath)) {
        Write-Host "      backend-ml directory not found!" -ForegroundColor Red
        return
    }
    Push-Location $mlPath
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        & ".venv\Scripts\Activate.ps1"
    }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mlPath'; python main.py" -WindowStyle Normal
    Pop-Location
    Write-Host "      ML Service starting... ✓" -ForegroundColor Green
}

function Start-NodeBackend {
    Write-Host "[3/3] Starting Node Backend (port 3000)..." -ForegroundColor Yellow
    $nodePath = Join-Path $root "backend-node"
    if (-not (Test-Path $nodePath)) {
        Write-Host "      backend-node directory not found!" -ForegroundColor Red
        return
    }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$nodePath'; npm run dev" -WindowStyle Normal
    Write-Host "      Node Backend starting... ✓" -ForegroundColor Green
}

Start-MongoDB
Start-MLService
Start-NodeBackend

Write-Host ""
Write-Host "  Services:" -ForegroundColor Cyan
Write-Host "  ├─ Node Backend  → http://localhost:3000" -ForegroundColor White
Write-Host "  ├─ ML Service    → http://localhost:8000" -ForegroundColor White
Write-Host "  ├─ API Docs      → http://localhost:8000/docs" -ForegroundColor White
Write-Host "  └─ MongoDB       → mongodb://localhost:27017/turtletrack" -ForegroundColor White
Write-Host ""
Write-Host "  Frontend: cd frontend && npx expo start" -ForegroundColor Gray
Write-Host ""
