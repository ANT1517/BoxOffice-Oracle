# Project Context: BoxOffice Oracle

**Course:** Data Mining — Course-Based Project (CBP), Academic Year 2026–27  
**Department:** Information Technology, VNR Vignana Jyothi Institute of Engineering & Technology (VNRVJIET), Hyderabad  
**Student:** Nadella Shyamanth  
**System Name:** BoxOffice Oracle  
**Architecture:** Full-Stack Web Application (FastAPI backend + Vite React TypeScript frontend + Python ML/Data Mining pipeline)  
**Master Reference:** `docs/BoxOffice_HitFlop_Master_Reference.pdf` (Version 1.0, 22 October 2026) — Single source of truth for data rules, features, leakage prevention, algorithms, and evaluation.

---

## 1. System Overview & Problem Statement

Studios invest massive capital into movies long before their release date. "BoxOffice Oracle" is a modern, interactive web application that predicts before theatrical release whether a movie will be a commercial **Hit** ($\text{ROI} \ge 2.0$) or a **Flop**, explains the reasoning behind each prediction, and provides real-time "what-if" scenario analysis (e.g. altering budget, cast, director, release window, or genre).

- **Core Predictive Task:**
  $$\text{roi\_ratio} = \frac{\text{revenue}}{\text{budget}}$$
  - **Binary Target:** `Hit` if $\text{roi\_ratio} \ge 2.0$, else `Flop` (theatrical break-even benchmark accounting for distributor splits and marketing).
  - **Optional 3-Class Variant:** `Flop` ($< 1.0\times$), `Average` ($1.0\times\text{--}2.5\times$), `Hit` ($\ge 2.5\times$).
- **Dual Model Architecture:**
  - **Model A (Pre-release Forecast):** Uses solely information known prior to release (green-light / pre-release features).
  - **Model B (Post-release Impact):** Extends Model A with post-release audience reception and engagement features (`vote_average`, `vote_count`, `popularity`), quantifying the measurable "value of reception."
- **Data Mining Syllabus Coverage (Pure Python Implementation):**
  - **Data Preprocessing & Cleaning:** Handling missing runtime, budget/revenue filters ($\ge \$10,000$), JSON parsing, outlier tracking, and zero-leakage feature engineering.
  - **OLAP Multidimensional Analysis:** Multi-axis cube implemented with pandas pivot tables covering Time (year $\to$ decade, month $\to$ season), Genre, Budget Tier, and Production Studio/Franchise. Operations include roll-up, drill-down, slice, dice, and pivot.
  - **Association Rule Mining:** Apriori and FP-Growth pattern mining on nominalized attributes (analyzing support, confidence, and lift for Class Association Rules).
  - **Classification Algorithms:**
    1. ZeroR (Majority-class baseline)
    2. ID3-style decision tree (entropy/information-gain based)
    3. CART / C4.5-style decision tree (pruned tree / gain ratio / numeric splitting)
    4. Naive Bayes (Gaussian & discretized)
    5. K-Nearest Neighbors (IBk equivalent, Euclidean distance with feature normalization)
    6. Random Forest (ensemble of decision trees with feature importance)
  - **Clustering Algorithms:**
    1. K-Means (Euclidean distance, k-means++ initialization, elbow method on inertia/SSE, classes-to-clusters mapping)
    2. Hierarchical Clustering (Agglomerative, Ward/Average linkage, dendrogram generation on sampled data)
  - **Evaluation Protocol:** Stratified 10-fold cross-validation (`random_state=1`) evaluated on Accuracy, Precision, Recall, F1 (weighted and per-class), ROC AUC, and Cohen's Kappa.

---

## 2. Hard Rules (Enforced Across All Phases)

1. **Strict No-Leakage Policy:**
   - `revenue` and `roi_ratio` are ground-truth target variables and must **never** be included as model inputs.
   - `vote_average`, `vote_count`, and `popularity` are post-release signals and must **never** appear in Model A.
   - Cast and director star power history must be computed strictly from films released **strictly prior** to the target film's release date.
2. **Single Shared Feature Module (`ml/features.py`):**
   - Training and serving share a single feature-building module: `ml/features.py`.
   - The backend service must compute features for new or what-if user inputs using the identical code utilized in offline model training. No duplicate feature definitions.
3. **Strict Empirical Integrity (No Fabrications):**
   - Never invent or synthesize numbers, metrics, evaluation scores, or citations.
   - Every metric, chart, and table shown in the frontend, backend, or reports must derive directly from executed code artifacts.
4. **No Unapproved Assumptions:**
   - Always request explicit confirmation before assuming anything that alters results, user experience, or architecture (thresholds, dropped rows, hyperparameters not in the PDF, new dependencies, or UI page layouts).
5. **Raw Data Immutability:**
   - Raw CSV files in `data/` remain untouched and are never modified or rewritten.
6. **Windows & PowerShell Compatibility:**
   - All execution scripts and commands must run natively on Windows using PowerShell.
7. **Phase Gate Protocol:**
   - At the conclusion of every phase, stop and report: completed tasks, created files, key numbers/statistics, any errors encountered, and open questions.
   - Wait for explicit user confirmation before initiating the next phase.

---

## 3. Repository Architecture

```
box_office_prediction/
├── data/              # Raw data downloads (read-only, never manually altered)
│   ├── tmdb_5000_movies.csv
│   ├── tmdb_5000_credits.csv
│   └── movies_metadata.csv (franchise enrichment)
├── docs/              # Master reference PDF and documentation
│   └── BoxOffice_HitFlop_Master_Reference.pdf
├── ml/                # Python package: preprocessing, features, mining, training, artifact export
│   ├── __init__.py
│   ├── data_prep.py   # Cleaning and dataset merging
│   ├── features.py    # The single feature builder shared by training and backend serving
│   ├── olap.py        # Multidimensional OLAP cube calculations
│   ├── rules.py       # Apriori and FP-Growth association rule miners
│   ├── models.py      # Classifier implementations (ID3, CART, NB, KNN, RF)
│   ├── cluster.py     # K-Means and Hierarchical clustering
│   └── train.py       # 10-fold CV evaluation, model serialization, artifact export
├── artifacts/         # Exported JSON artifacts and serialized models for the web app
│   ├── models/        # Trained scikit-learn / custom models (.joblib)
│   ├── metrics.json   # 10-fold CV comparison tables, confusion matrices, ROC curves
│   ├── eda.json       # Distributions, correlation matrices, class splits
│   ├── olap.json      # Pre-aggregated OLAP cube operations
│   ├── rules.json     # Association rules with support, confidence, lift
│   ├── clusters.json  # Centroids, elbow curve data, classes-to-clusters breakdown
│   └── people_index.json # Autocomplete lookup for actors and directors
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── main.py    # FastAPI entry point, CORS, lifecycle
│   │   ├── routers/   # Endpoints: predict, explain, olap, rules, clusters, metrics
│   │   ├── schemas/   # Pydantic request/response models
│   │   └── services/  # Prediction inference, what-if computation, artifact loaders
│   └── tests/         # Pytest test suite for API and feature integrity
├── frontend/          # React + Vite + TypeScript web application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── components/ # Reusable UI components (Glassmorphism, Dark Mode)
│       ├── pages/      # Prediction & What-If, Model Comparison, OLAP Explorer, Rules & Clusters
│       └── services/   # API client interacting with FastAPI backend
├── scripts/           # PowerShell automation scripts
│   ├── setup.ps1      # Installs Python venv and npm packages
│   ├── train.ps1      # Runs the ML training and artifact generation pipeline
│   ├── run_backend.ps1 # Starts FastAPI via Uvicorn
│   └── run_frontend.ps1 # Starts Vite dev server
├── report/            # Course project report and slide presentation assets
├── .env               # Environment configuration (ports, hosts)
├── requirements.txt   # Python dependencies
└── PROJECT_CONTEXT.md # Governance, system state, and phase log
```

---

## 4. Feature Attribute Specifications

### Feature Separation Matrix (Reference PDF §6.3)

| Attribute Group | Availability Time | Model A (Pre-release) | Model B (Post-release) | Rules (Nominal) | Clustering (Numeric) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| Budget, genre, runtime, language, studio, franchise, month/season | Before release | ✓ | ✓ | ✓ | Partly |
| Cast & director track record (strictly earlier films only) | Before release | ✓ | ✓ | ✓ (tertiles) | ✓ |
| `vote_average` (audience rating) | After release | ✗ | ✓ | ✓ (rating band) | ✓ |
| `vote_count`, `popularity` (engagement/hype) | After release (2017 snapshot) | ✗ | ✓ | ✓ (hype level) | ✓ |
| `revenue`, `roi_ratio` | After release (Ground truth outcome) | ✗ | ✗ | ✗ (label only) | Descriptive only |

### Model A Attribute Set (16 Predictors + 1 Target)
1. `log_budget` (float) - $\log_{10}(\text{budget})$
2. `runtime` (float) - Imputed with median runtime
3. `n_genres` (int) - Count of associated genres
4. `is_english` (int: 0/1) - `original_language == "en"`
5. `big_studio` (int: 0/1) - Top 10 production company flag
6. `franchise` (int: 0/1) - Collection member, sequel/remake/comic keyword, or numbered title
7. `release_month` (int: 1–12)
8. `holiday_flag` (int: 0/1) - Released in November or December
9. `cast_avg_past_revenue` (float) - Mean revenue of top 3 billed actors from strictly earlier films
10. `cast_past_hit_rate` (float) - Prior hit rate of top 3 billed actors from strictly earlier films
11. `cast_past_films` (int) - Total appearances in strictly earlier films
12. `dir_avg_past_revenue` (float) - Mean past revenue of director from strictly earlier films
13. `dir_past_hit_rate` (float) - Prior hit rate of director from strictly earlier films
14. `dir_past_films` (int) - Director appearances in strictly earlier films
15. `primary_genre` (string / one-hot) - First listed genre
16. `season` (string / one-hot) - Summer, Holiday, Dump, Regular
17. `label` (string: Hit / Flop) - **Target variable**

### Model B Attribute Set (19 Predictors + 1 Target)
- All 16 predictors from Model A
- `vote_average` (float) - Audience rating (0–10)
- `vote_count` (int) - Total ratings submitted
- `popularity` (float) - TMDb engagement metric
- `label` (string: Hit / Flop) - **Target variable**

---

## 5. API Specification (Section 11 of Master Reference v2)

The REST API is finalised in Phase 5; until then, treat Section 11 of `docs/BoxOffice_Oracle_Master_Reference_v2.pdf` as the source of truth:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service status, model load state, artifact timestamps. |
| `/api/meta` | `GET` | Dataset metadata: total films, date range, genre vocabulary, class distribution, default thresholds. |
| `/api/people/search` | `GET` | RapidFuzz fuzzy autocomplete for actors and directors with historical track records (past revenue, hit rate, appearances). |
| `/api/predict` | `POST` | Inference using Model A or Model B. Returns Hit/Flop prediction, probability, risk tier, and explanation factors (decision tree traversal path & feature contributions). |
| `/api/whatif` | `POST` | Real-time scenario simulator evaluating marginal changes (budget delta, date shifts, cast/director replacements) against a baseline film. |
| `/api/movies/search` | `GET` | Search and retrieve historical movie records for pre-populating what-if scenarios. |
| `/api/insights/eda` | `GET` | Exploratory data analysis metrics: feature distributions, class balance, correlation matrices. |
| `/api/olap/query` | `POST` | Execute dynamic multidimensional queries on the OLAP cube (roll-up, drill-down, slice, dice). |
| `/api/olap/presets` | `GET` | Precomputed canonical OLAP cube views (e.g. decade roll-up, genre slice, seasonal breakdown). |
| `/api/rules` | `GET` | Association rules discovered via Apriori and FP-Growth with support, confidence, and lift. |
| `/api/clusters` | `GET` | K-Means and Hierarchical clustering profiles, inertia elbow curve, centroids, and classes-to-clusters mappings. |
| `/api/models` | `GET` | Comprehensive 10-fold cross-validation benchmark results across all algorithms (ID3, CART, NB, KNN, RF) vs ZeroR baseline. |

---

## 6. Phase Log

### Phase 0: Setup & Pivot to Full-Stack Web Application
- **Status:** Complete.
- **Actions Completed:**
  - Pivoted architecture from Weka CLI to modern full-stack web application (**BoxOffice Oracle**).
  - Deleted Weka-specific directories (`results/weka`, `results/tables`) and legacy folders (`out/`, `figures/`, `olap/`).
  - Cleared `WEKA_*` environment variables from `.env`.
  - Established new repository structure: `ml/`, `artifacts/`, `backend/app/routers`, `backend/app/schemas`, `backend/app/services`, `backend/tests`, `frontend/`, `scripts/`, `report/`.
  - Authored updated `requirements.txt` incorporating FastAPI, Uvicorn, Pydantic, RapidFuzz, Pytest, Scikit-Learn, Mlxtend, OpenPyXL, and PyArrow.
  - Installed and verified dependencies in `.venv`. Verified Node.js (`v24.16.0`) and npm (`11.13.0`).

### Phase 2: Data Pipeline, Feature Engineering & App Lookups
- **Status:** Complete.
- **Actions Completed:**
  - Verified source datasets in `data/`: `tmdb_5000_movies.csv` (4,803 rows), `tmdb_5000_credits.csv` (4,803 rows), `movies_metadata.csv` (45,466 rows).
  - Verified original `docs/prepare_movies.py` docstring and logic.
  - Refactored pipeline into `ml/clean.py` (rules R1-R9), `ml/features.py` (unified batch & single-movie feature builder), and `ml/build_dataset.py`. Dropped legacy Weka ARFF exports.
  - Built dataset artifacts: `artifacts/data/movies_clean.csv`, `artifacts/data/movies_clean.parquet` (3,204 rows), and `artifacts/data/cleaning_log.txt`.
  - Class distribution confirmed: 1,801 Hits (56.21%), 1,403 Flops (43.79%). Minority class > 40% confirms no class rebalancing is needed.
  - Built lookup tables in `artifacts/lookups/`: `people.json` (4,934 actors & directors with film histories), `studios.json` (with top 10 big studios), `genres.json`, `languages.json`, and `feature_context.joblib`.
  - Developed and executed parity test in `ml/tests/test_feature_parity.py`: 20 randomly sampled films verified 100% feature match between single-movie mode and batch mode.
  - Generated validation documentation in `artifacts/data/validation.md`.
  - Created PowerShell launcher `scripts/build_data.ps1`.

### Phase 3 Corrections Applied:
- Plainly noted weak/overlapping cluster structure (silhouette 0.16–0.32) with $k=2$ having highest silhouette ($0.3204$) and $k=3$ ($0.1939$) chosen for market segment interpretability.
- Renamed Cluster 2 to "Low-Budget Indie / Sleeper Releases" (vote_average is +0.36 std). Characterized Ward ARI (0.2452) as weak-to-moderate agreement.
- Added second association rules benchmark at `min_support=0.01` (Apriori 1.659s vs FP-Growth 1.482s; 100% rule parity confirmed) with analytical explanation.
- Flagged cells with sample size $N < 30$ as `small_sample` across OLAP and EDA outputs.

### Phase 4: Supervised Learning & Classifiers
- **Status:** Complete.
- **Actions Completed:**
  - Evaluated 6 model families (ZeroR baseline, ID3-style Tree, CART / C4.5 Tree, Naive Bayes [Gaussian & Categorical], KNN sweep, Random Forest) via 10-Fold Stratified Cross-Validation (`random_state=1`) over 3,204 films on both Model A (16 pre-release predictors) and Model B (19 predictors, adding post-release reception).
  - Applied nested cross-validation (inner 3-fold CV) for CART (`min_samples_leaf` $\in \{2, 10, 25\}$, tuned leaf=25) and Random Forest (`max_depth` $\in \{\text{None}, 8, 12\}$, tuned depth=8 for A, depth=None for B), eliminating hyperparameter selection leakage.
  - Performed 10×10 Repeated Stratified CV (100 folds) with the **Nadeau–Bengio (2003)** corrected resampled t-test to rigorously establish statistical significance against baseline and quantify the impact of post-release reception ($p < 10^{-6}$).
  - Computed feature importances via Mutual Information, Random Forest MDI impurity, and Permutation Importance on out-of-fold/test data.
  - Selected Production Models: **Random Forest** for Model A (Accuracy: 65.73%, Weighted F1: 0.6561, ROC AUC: 0.7146) and **Random Forest** for Model B (Accuracy: 76.31%, Weighted F1: 0.7621, ROC AUC: 0.8372).
### Phase 4 Fixes & Model Re-calibration:
- Confirmed repeated-CV optimization: strictly 10×10 Repeated Stratified CV (100 paired folds) across identical train/test splits for all models, with all preprocessing inside Pipeline objects, and zero reduction in dataset or hyperparameter search grids.
- Re-calibrated both production models with `CalibratedClassifierCV(method='sigmoid', cv=5, ensemble=False)` and `compress=3`:
  - `model_A.joblib`: shrunk from 26.4 MB down to **1.38 MB** (Brier score: 0.1629)
  - `model_B.joblib`: shrunk from 118.1 MB down to **5.28 MB** (Brier score: 0.0168)
  - Both models are well below the 50 MB threshold and GitHub's 100 MB limit.
- Added `artifacts/models/*.joblib` to `.gitignore`.
- Updated `model_card.json` with detailed `method_notes` and added explanatory limitation regarding post-release snapshots.

### Phase 5: Backend API (FastAPI)
- **Status:** Complete.
- **Actions Completed:**
  - Built production FastAPI application in `backend/app/` matching Section 11 of the Master Reference v2.
  - Implemented schema models in `backend/app/schemas/` (`MovieInput`, `PredictResponse`, `WhatIfRequest`, `WhatIfResponse`, `MovieSearchItem`, `OlapQueryRequest`, `OlapQueryResponse`, `PersonSearchItem`) with strict Pydantic validation (budget > 0, valid release dates, runtime > 0, <= 3 cast members).
  - Built high-performance singleton artifact store `ArtifactStore` in `backend/app/services/loader.py`, pre-loading models and lookups once at startup with fail-fast validation.
  - Built unified prediction service `predictor.py` executing `ml.features.build_single_movie_features()` (strict zero-leakage parity), selecting Model A or Model B dynamically, assigning risk tiers, and computing local explanation deltas via `explain()`.
  - Built counterfactual what-if simulation service `whatif_service.py`.
  - Built hybrid prefix + RapidFuzz search service `search_service.py` for actors, directors, and historical dataset movies (< 5ms latency).
  - Registered 10 endpoints across modular routers: `/api/health`, `/api/meta`, `/api/people/search`, `/api/predict`, `/api/whatif`, `/api/movies/search`, `/api/insights/eda`, `/api/olap/query`, `/api/olap/presets`, `/api/rules`, `/api/clusters`, `/api/models`.
  - Added CORS middleware restricted strictly to Vite development server origin read from `.env` (`http://localhost:5173`, `http://127.0.0.1:5173`).
  - Implemented comprehensive pytest suite `backend/tests/test_api.py` (17/17 tests passing across the repository).
  - Verified PowerShell launcher `scripts/run_backend.ps1` and Swagger documentation at `/docs`.




