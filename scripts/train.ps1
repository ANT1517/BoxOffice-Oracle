# scripts/train.ps1 - Automated execution script for Phase 4: Supervised Learning & Classifiers
$ErrorActionPreference = "Stop"

Write-Host "=== Starting BoxOffice Oracle Phase 4: Model Training & Evaluation Pipeline ===" -ForegroundColor Cyan

# 1. Verify virtual environment
$pythonPath = ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonPath)) {
    Write-Error "Virtual environment Python not found at $pythonPath. Run scripts/setup.ps1 first."
}

# 2. Execute model training, cross-validation, significance testing, and artifact export
Write-Host "`n[1/2] Running 10-fold CV, Significance Testing, Probability Calibration and Model Serialization..." -ForegroundColor Yellow
& $pythonPath -u -m ml.models

if ($LASTEXITCODE -ne 0) {
    Write-Error "Phase 4 model training failed with exit code $LASTEXITCODE"
}

# 3. Verify all expected artifacts exist on disk
Write-Host "`n[2/2] Verifying generated Phase 4 artifacts..." -ForegroundColor Yellow
$requiredFiles = @(
    "artifacts\models\metrics.json",
    "artifacts\models\significance.json",
    "artifacts\models\importance.json",
    "artifacts\models\model_A.joblib",
    "artifacts\models\model_B.joblib",
    "artifacts\models\model_card.json",
    "artifacts\models\tree_model_A.txt",
    "artifacts\models\tree_model_A.json",
    "report\comparison_table.md",
    "report\figures\calibration_curves.png"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "  [OK] $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Error "Missing expected artifact: $file"
    }
}

Write-Host "`n=== Phase 4 Model Training Pipeline Finished Successfully! ===" -ForegroundColor Cyan
