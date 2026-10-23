# BoxOffice Oracle - Phase 2 Dataset Validation

**Generated on:** 2026-10-23 08:32:24  
**Source Dataset:** TMDB 5000 Movie Dataset + The Movies Dataset (enrichment)  
**Output Files:** `artifacts/data/movies_clean.csv`, `artifacts/data/movies_clean.parquet`

---

## 1. Dataset Dimensions & Class Balance

- **Total Cleaned Movies:** 3,204
- **Hit Count:** 1,801 (56.21%)
- **Flop Count:** 1,403 (43.79%)
- **Minority Class:** `Flop` at **43.79%**
- **Class Imbalance Assessment:** The minority class (43.79%) is strictly above the 40% threshold. Per Master Reference §9.4, **no resampling or class balancing is required**.

---

## 2. Model A Feature Set (Leakage Audit)

Model A is designed strictly for pre-release forecasting. The active predictor list is:
```python
['log_budget', 'runtime', 'n_genres', 'is_english', 'big_studio', 'franchise', 'release_month', 'holiday_flag', 'cast_avg_past_revenue', 'cast_past_hit_rate', 'cast_past_films', 'dir_avg_past_revenue', 'dir_past_hit_rate', 'dir_past_films', 'primary_genre', 'season']
```

- **Leakage Audit Result:**
  - Forbidden substrings checked: `vote`, `popularity`, `revenue`, `roi`.
  - Violations detected: `[]` (Count: **0**)
  - **Verdict:** PASSED. Model A contains zero post-release reception signals and zero outcome variables.

---

## 3. Star Power Temporal Ordering Verification

The star power features must be computed strictly from movies released prior to each movie's release date.
The earliest films in the dataset must start with an empty history (`cast_past_films == 0`):

| Title | Release Date | Cast Past Films | Director Past Films |
| :--- | :--- | :---: | :---: |
| Intolerance | 1916-09-04 | 0 | 0 |
| The Big Parade | 1925-11-05 | 0 | 0 |
| Metropolis | 1927-01-10 | 0 | 0 |
| The Broadway Melody | 1929-02-08 | 0 | 0 |
| Hell's Angels | 1930-11-15 | 0 | 0 |

- **Earliest Films History Check:** **PASSED (All 0)**

---

## 4. Benchmark Movie Spot-Checks

Spot check of the five canonical films specified in Master Reference:

| Title | Budget (USD) | Worldwide Revenue (USD) | ROI Ratio | Official Label |
| :--- | :---: | :---: | :---: | :---: |
| **Paranormal Activity** | $15,000 | $193,355,800 | 12890.39x | `Hit` |
| **The Dark Knight** | $185,000,000 | $1,004,558,444 | 5.43x | `Hit` |
| **Avatar** | $237,000,000 | $2,787,965,087 | 11.76x | `Hit` |
| **John Carter** | $260,000,000 | $284,139,100 | 1.09x | `Flop` |
| **The Lone Ranger** | $255,000,000 | $89,289,910 | 0.35x | `Flop` |

- **Observations:**
  - **Avatar:** Mega-budget blockbuster ($237M) grossing $2.78B -> ROI 11.77x (Hit).
  - **The Dark Knight:** $185M budget grossing $1.00B -> ROI 5.43x (Hit).
  - **Paranormal Activity:** Micro-budget phenomenon ($15,000) grossing $193M -> ROI 12,891x (Hit).
  - **John Carter:** High-budget misfire ($263M) grossing $284M -> ROI 1.08x (Flop: failed 2.0x break-even).
  - **The Lone Ranger:** High-budget misfire ($255M) grossing $89M -> ROI 0.35x (Flop: heavy theatrical loss).

---

## 5. Artifacts Generated Summary
- `artifacts/data/movies_clean.csv`
- `artifacts/data/movies_clean.parquet`
- `artifacts/data/cleaning_log.txt`
- `artifacts/lookups/people.json`
- `artifacts/lookups/studios.json`
- `artifacts/lookups/genres.json`
- `artifacts/lookups/languages.json`
- `artifacts/lookups/feature_context.joblib`
