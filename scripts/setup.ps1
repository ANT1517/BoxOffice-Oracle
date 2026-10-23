# scripts/setup.ps1 - Complete End-to-End Setup Script for BoxOffice Oracle
# Sets up a fresh clone from scratch: venv, pip install, npm install, build data, mine, train.
$ErrorActionPreference = "Stop"

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "       BoxOffice Oracle - Complete Setup & Pipeline        " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

# 1. Environment Prerequisite Checks
Write-Host "`n[1/7] Checking runtime prerequisites..." -ForegroundColor Yellow
$pythonCmd = "python"
if (-not (Get-Command $pythonCmd -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed or not in PATH."
}
Write-Host "  [OK] $(python --version)" -ForegroundColor Green

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH."
}
Write-Host "  [OK] Node $(node --version)" -ForegroundColor Green
Write-Host "  [OK] npm $(npm.cmd --version)" -ForegroundColor Green

# 2. Virtual Environment Creation
Write-Host "`n[2/7] Initializing Python virtual environment (.venv)..." -ForegroundColor Yellow
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "  [OK] Created .venv" -ForegroundColor Green
} else {
    Write-Host "  [OK] Existing .venv verified" -ForegroundColor Green
}
$pythonVenv = ".venv\Scripts\python.exe"
$pipVenv = ".venv\Scripts\pip.exe"

# 3. Python Dependency Installation
Write-Host "`n[3/7] Installing Python backend & ML dependencies..." -ForegroundColor Yellow
& $pythonVenv -m pip install -r requirements.txt --quiet
Write-Host "  [OK] Python dependencies installed successfully." -ForegroundColor Green

# 4. Frontend Dependency Installation
Write-Host "`n[4/7] Installing Frontend npm dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\package.json") {
    Push-Location frontend
    npm.cmd install --quiet
    Pop-Location
    Write-Host "  [OK] Node modules installed successfully." -ForegroundColor Green
} else {
    Write-Warning "frontend\package.json not found."
}

# 5. Build Clean Data & Engineer Features (Phase 2)
Write-Host "`n[5/7] Building cleaned dataset and engineering features..." -ForegroundColor Yellow
& $pythonVenv -m ml.build_dataset
if ($LASTEXITCODE -ne 0) { Write-Error "Phase 2 dataset build failed." }
Write-Host "  [OK] Dataset built: artifacts/data/movies_clean.parquet (3,204 titles)" -ForegroundColor Green

# 6. Run Descriptive Mining Suite (Phase 3: EDA, OLAP, Rules, Clusters)
Write-Host "`n[6/7] Running descriptive mining pipeline (EDA, OLAP, CARs, Clustering)..." -ForegroundColor Yellow
Write-Host "  -> Running Exploratory Data Analysis..." -ForegroundColor Gray
& $pythonVenv -m ml.eda
Write-Host "  -> Precomputing Canonical OLAP Presets..." -ForegroundColor Gray
& $pythonVenv -m ml.olap
Write-Host "  -> Mining Association Rules (Apriori & FP-Growth benchmarks)..." -ForegroundColor Gray
& $pythonVenv -m ml.rules
Write-Host "  -> Computing K-Means & Hierarchical Clusters..." -ForegroundColor Gray
& $pythonVenv -m ml.cluster
if ($LASTEXITCODE -ne 0) { Write-Error "Phase 3 descriptive mining failed." }
Write-Host "  [OK] Descriptive mining artifacts generated." -ForegroundColor Green

# 7. Train Supervised Classification Models (Phase 4)
Write-Host "`n[7/7] Training Supervised Models (Model A & B 10-fold CV & calibration)..." -ForegroundColor Yellow
& $pythonVenv -m ml.models
if ($LASTEXITCODE -ne 0) { Write-Error "Phase 4 model training failed." }
Write-Host "  [OK] Models trained, calibrated, and serialized to artifacts/models" -ForegroundColor Green

$stopwatch.Stop()
$elapsedSec = [math]::Round($stopwatch.Elapsed.TotalSeconds, 1)

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host "  Setup & Complete Pipeline Finished Successfully!" -ForegroundColor Green
Write-Host "  Total Execution Time: $elapsedSec seconds" -ForegroundColor Yellow
Write-Host "  To launch the application, run: .\scripts\start_all.ps1" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
