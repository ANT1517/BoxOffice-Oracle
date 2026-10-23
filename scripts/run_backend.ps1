# run_backend.ps1 - Start FastAPI backend server
$ErrorActionPreference = "Stop"

Write-Host "=== Starting BoxOffice Oracle Backend API Server ===" -ForegroundColor Cyan
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Error "Virtual environment .venv not found. Run scripts\setup.ps1 first."
}

& .venv\Scripts\python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
