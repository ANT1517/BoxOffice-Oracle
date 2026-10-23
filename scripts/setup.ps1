# setup.ps1 - Environment setup script for BoxOffice Oracle (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "=== Setting up BoxOffice Oracle ===" -ForegroundColor Cyan

# 1. Check Python
$pythonCmd = "python"
if (-not (Get-Command $pythonCmd -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed or not in PATH."
}
Write-Host "[Python] Using: $(python --version)" -ForegroundColor Green

# 2. Check Node & npm
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH."
}
Write-Host "[Node] Using: $(node --version)" -ForegroundColor Green
Write-Host "[npm] Using: $(npm --version)" -ForegroundColor Green

# 3. Create or activate .venv
if (-not (Test-Path ".venv")) {
    Write-Host "[venv] Creating virtual environment .venv..." -ForegroundColor Yellow
    python -m venv .venv
}
Write-Host "[venv] Virtual environment ready." -ForegroundColor Green

# 4. Install Python dependencies
Write-Host "[pip] Installing Python dependencies..." -ForegroundColor Yellow
& .venv\Scripts\pip install --upgrade pip
& .venv\Scripts\pip install -r requirements.txt
Write-Host "[pip] Dependencies installed successfully." -ForegroundColor Green

# 5. Frontend dependencies (if package.json exists)
if (Test-Path "frontend\package.json") {
    Write-Host "[npm] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
    Write-Host "[npm] Frontend dependencies installed." -ForegroundColor Green
}

Write-Host "=== Setup Complete! ===" -ForegroundColor Cyan
