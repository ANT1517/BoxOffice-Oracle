# mine.ps1 - Descriptive Data Mining Pipeline for BoxOffice Oracle
# Runs EDA, OLAP cube precomputations, Association Rules, and Clustering
$ErrorActionPreference = "Stop"

Write-Host "=== Starting BoxOffice Oracle Phase 3: Descriptive Mining Pipeline ===" -ForegroundColor Cyan

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Error "Virtual environment .venv not found. Run scripts\setup.ps1 first."
}

# 1. Exploratory Data Analysis (EDA)
Write-Host "`n[1/4] Running Exploratory Data Analysis (EDA)..." -ForegroundColor Yellow
& .venv\Scripts\python -m ml.eda

# 2. OLAP Cube Operations
Write-Host "`n[2/4] Precomputing Canonical OLAP Cube Presets..." -ForegroundColor Yellow
& .venv\Scripts\python -m ml.olap

# 3. Association Rules Mining (Apriori & FP-Growth)
Write-Host "`n[3/4] Mining Association Rules and Running Benchmarks..." -ForegroundColor Yellow
& .venv\Scripts\python -m ml.rules

# 4. Clustering (K-Means & Hierarchical)
Write-Host "`n[4/4] Executing K-Means and Hierarchical Clustering..." -ForegroundColor Yellow
& .venv\Scripts\python -m ml.cluster

Write-Host "`n=== Phase 3 Descriptive Mining Pipeline Finished Successfully! ===" -ForegroundColor Green
Write-Host "Artifacts written to: artifacts/eda, artifacts/olap, artifacts/rules, artifacts/clusters" -ForegroundColor Cyan
Write-Host "Reports written to: report/eda_observations.md, report/cluster_interpretation.md, report/figures" -ForegroundColor Cyan
