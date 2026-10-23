# build_data.ps1 - Data cleaning, feature engineering, and artifact export script
$ErrorActionPreference = "Stop"

Write-Host "=== Running BoxOffice Oracle Phase 2 Data Pipeline ===" -ForegroundColor Cyan

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Error "Virtual environment .venv not found. Run scripts\setup.ps1 first."
}

& .venv\Scripts\python -m ml.build_dataset

Write-Host "=== Phase 2 Pipeline Finished Successfully! ===" -ForegroundColor Green
