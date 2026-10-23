# run_frontend.ps1 - Start Vite frontend dev server
$ErrorActionPreference = "Stop"

Write-Host "=== Starting BoxOffice Oracle Frontend Development Server ===" -ForegroundColor Cyan
if (-not (Test-Path "frontend\package.json")) {
    Write-Warning "frontend\package.json not found yet. Scaffold frontend first."
    Exit 1
}

Push-Location frontend
npm run dev
Pop-Location
