# BoxOffice Oracle - End-to-End Manual Testing Procedure & Verification Checklist

This manual verification protocol guides developers, QA engineers, and business evaluators through end-to-end verification of the **BoxOffice Oracle** theatrical intelligence system.

---

## Prerequisites
1. Open PowerShell and run:
   ```powershell
   .\scripts\start_all.ps1
   ```
2. Confirm the services are up:
   - Backend API: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Frontend Dashboard: [http://localhost:5173](http://localhost:5173)

---

## Test Scenario 1: Multi-Archetype Movie Predictions (API vs UI Parity)

### Objective:
Verify that the Predictor page accurately ingests historical movies from the lookup dataset and delivers predictions matching the underlying calibrated API.

### Steps:
1. Navigate to **Greenlight Predictor** (`/predict`).
2. Click the **"Browse Dataset Movies"** modal button.
3. **Test Case 1A: Franchise Tentpole (*Avengers: Age of Ultron*)**
   - Search for `Avengers: Age of Ultron` and select it.
   - Verify auto-populated inputs: Budget = `$280,000,000`, Director = `Joss Whedon`, Franchise = `Checked`.
   - Click **Run Decision Engine**.
   - **Expected Result**:
     - Pre-Release Model A Hit Probability displays **~80%** (Risk Tier: *Low Risk* / *Commercial Hit*).
     - Waterfall factor decomposition displays top drivers: Big Studio backing, Franchise continuation, and Cast Past Star Revenue.
     - Out-of-fold probability badge shows `OOF: 80.2%`.
4. **Test Case 1B: Micro-Budget Horror Breakout (*Saw*)**
   - Click "Browse Dataset Movies", search for `Saw` (2004), and select it.
   - Verify Budget = `$1,200,000`, Director = `James Wan`, Franchise = `Unchecked`.
   - Click **Run Decision Engine**.
   - **Expected Result**:
     - Pre-Release Model A Hit Probability displays **~42%** (Flop prediction due to unproven indie talent).
     - Switch model selector to **Model B (+ Reception)** and enter Vote Average = `7.3`, Vote Count = `2184`.
     - Hit Probability jumps to **~89%** (Hit prediction).
5. **Test Case 1C: Mid-Budget Original Flop (*Battlefield Earth*)**
   - Click "Browse Dataset Movies", search for `Battlefield Earth` (2000), and select it.
   - Verify Budget = `$44,000,000`, Cast contains `John Travolta`.
   - Click **Run Decision Engine**.
   - **Expected Result**:
     - Pre-Release Model A predicts **~61%** (inflated by John Travolta's 90s star power).
     - Switch to **Model B** with TMDb rating `2.1` / `3.0`.
     - Hit probability collapses to **~17%** (*Extreme Deficit Risk*).

---

## Test Scenario 2: What-If Release Month Sensitivity Analysis

### Objective:
Verify that the What-If simulation engine evaluates all 12 calendar release months and renders an interactive sensitivity curve.

### Steps:
1. Navigate to **What-If Studio** (`/what-if`).
2. Select or enter any film configuration (e.g. Budget = `$40M`, Primary Genre = `Action`).
3. Under **Sensitivity Parameter**, select **Release Month (1–12)**.
4. Click **Run What-If Simulation**.
5. **Expected Result**:
   - The interactive chart renders exactly **12 data points** (January through December).
   - Months 5, 6, 7 (Summer Corridor) and 11, 12 (Holiday Corridor) exhibit distinct positive probability bumps.
   - Month 1 and 2 (January/February Dump Months) show reduced probabilities.
   - Deltas vs base probability are clearly reported in the ledger table.

---

## Test Scenario 3: Multidimensional OLAP Cube Presets & Aggregations

### Objective:
Verify dynamic OLAP cube operations across the 3,204 historical films.

### Steps:
1. Navigate to **Exploratory Insights** (`/insights`) and click the **Dynamic OLAP Cube** tab.
2. Click through each canonical preset button:
   - **Drilldown**: `Genre × Season` &rarr; table populates with genre and seasonal cross-sections.
   - **Slice**: `budget_tier` for `Horror` films &rarr; displays Low, Medium, High budget horror hit rates and median ROIs.
   - **Dice**: `Summer/Holiday × Big Studio × Action/Adventure` &rarr; verifies filtered cell combinations.
   - **Pivot**: `Primary Genre × Release Decade` &rarr; multi-decade ledger.
   - **Rollup**: `Season` &rarr; 4 rows summarizing Summer, Holiday, Dump, and Regular corridors.
3. Verify sample size flags:
   - Cells with $N < 30$ are marked with an amber badge (`Small Sample N<30`).
   - Cells with $N < 10$ are marked with a red badge (`Low Conf N<10`).
   - Median ROI is used as the primary financial measure to prevent single-title outlier distortion.

---

## Test Scenario 4: Class Association Rules (CARs) Filtering & Benchmark

### Objective:
Verify association rule mining discovery, dual-threshold benchmark reporting, and interactive rule filters.

### Steps:
1. Navigate to **Patterns & Clusters** (`/patterns`).
2. Examine the **Algorithmic Parity & Benchmark Card**:
   - Verify that **both** benchmarks are displayed side-by-side:
     - **Benchmark A (`min_support = 0.03`)**: Shows Apriori faster (~200 ms vs ~363 ms).
     - **Benchmark B (`min_support = 0.01`)**: Shows FP-Growth faster (~1,050 ms vs ~1,444 ms).
   - Verify the takeaway quote displays:
     > *"FP-Growth avoids candidate generation and usually wins on larger or denser data / lower support; on this small dataset at high support, Apriori's vectorised implementation was faster."*
3. Test Rule Filters:
   - Click **Hit** &rarr; all rules have consequent `[Hit]`.
   - Click **Flop** &rarr; all rules have consequent `[Flop]`.
   - Check **Strictly Pre-Release Rules** &rarr; rules with post-release ratings/votes disappear.
   - Change **Min Lift** dropdown to `≥ 1.4` &rarr; table updates to only show strong rules with lift $\ge 1.4$.

---

## Test Scenario 5: Models Page Metric Parity with Artifacts

### Objective:
Verify that the Models evaluation page displays exact performance metrics matching `artifacts/models/metrics.json`.

### Steps:
1. Navigate to **Models & Benchmarks** (`/models`).
2. Toggle between **Model A (Pre-Release)** and **Model B (+ Reception)** tabs.
3. Compare the numbers against `artifacts/models/metrics.json`:
   - **ZeroR Majority Baseline**: Accuracy = **56.21%**, Confusion Matrix = `[[0, 1403], [0, 1801]]`.
   - Red dashed horizontal reference line sits at **56.21%**.
   - **Calibrated Logistic Regression (Production)**: Accuracy, Weighted F1, and ROC-AUC match the JSON file exactly.
   - **Permutation Importance chart**: Verified that top features are `log_budget`, `cast_avg_past_revenue`, `franchise`, etc.
   - **Tree Rule Extraction (ID3 & CART)**: Renders the human-readable decision rules.

---

## Test Scenario 6: Cluster Archetype Naming

### Objective:
Confirm Cluster 1 has been renamed without referencing genre.

### Steps:
1. Navigate to **Patterns & Clusters** (`/patterns`) and scroll to **Theatrical Archetypes (K-Means)**.
2. Confirm the 3 cluster cards display:
   - **Cluster 0**: *High-Budget, High-Engagement Blockbusters*
   - **Cluster 1**: *Mid-Budget, Low-Engagement Mainstream Releases* (No mention of "Drama")
   - **Cluster 2**: *Low-Budget Indie / Sleeper Releases*
