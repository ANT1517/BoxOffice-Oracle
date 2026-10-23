# scripts/start_all.ps1 - Unified startup script for BoxOffice Oracle
# Starts both FastAPI Backend (port 8000) and Vite Frontend (port 5173) concurrently.
$ErrorActionPreference = "Stop"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "         BoxOffice Oracle - Unified System Launcher        " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

# 1. Validation checks
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Error "Virtual environment .venv not found. Run scripts\setup.ps1 first."
}
if (-not (Test-Path "frontend\package.json")) {
    Write-Error "frontend\package.json not found. Run scripts\setup.ps1 first."
}

Write-Host "[1/3] Preparing services..." -ForegroundColor Yellow
Write-Host "  - Backend API: http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)" -ForegroundColor Gray
Write-Host "  - Frontend UI: http://localhost:5173" -ForegroundColor Gray

# 2. Launch Backend Process
Write-Host "`n[2/3] Starting FastAPI Backend on port 8000..." -ForegroundColor Green
$backendProc = Start-Process -FilePath ".venv\Scripts\python.exe" `
    -ArgumentList "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000" `
    -PassThru -NoNewWindow

# 3. Launch Frontend Process
Write-Host "[3/3] Starting Vite Frontend on port 5173..." -ForegroundColor Green
$frontendProc = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run dev" `
    -WorkingDirectory (Join-Path $PSScriptRoot "..\frontend") `
    -PassThru -NoNewWindow

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host "  BoxOffice Oracle is running!" -ForegroundColor Green
Write-Host "  Press Ctrl+C or enter 'stop' to terminate both processes." -ForegroundColor Yellow
Write-Host "===========================================================`n" -ForegroundColor Cyan

try {
    # Keep script alive while monitoring processes
    while (-not $backendProc.HasExited -and -not $frontendProc.HasExited) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nStopping BoxOffice Oracle services..." -ForegroundColor Yellow
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProc -and -not $frontendProc.HasExited) {
        Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
    }
    # Clean up any lingering node or python uvicorn child instances
    Get-Process -Name "node", "uvicorn" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*box_office_prediction*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "All services stopped." -ForegroundColor Green
}
