# Exploratory Data Analysis & Empirical Observations

**Dataset Source:** TMDB 5000 + The Movies Dataset (Cleaned)  
**Total Cleaned Titles:** 3,204  
**Hit Ratio Threshold:** Revenue $\ge$ 2.0x Budget

---

## 1. Class Distribution & Balance
- The cleaned dataset comprises **3,204 films**, with **1,801 Hits (56.21%)** and **1,403 Flops (43.79%)**.
- The minority class (`Flop` at 43.79%) comfortably exceeds the 40% threshold. Thus, no synthetic sampling (SMOTE/Resample) is required.
- Under the 3-class target (Flop < 1.0x, Average 1.0-2.5x, Hit >= 2.5x), there are **1,508 Hits (47.07%)**, **921 Averages (28.75%)**, and **775 Flops (24.19%)**.

---

## 2. Key Empirical Observations (Backed by Data)

1. **Prevalence of First-Time and Dataset-Newcomer Talent:**
   - **1,427 films (44.54%)** have **zero director history** (`dir_past_films == 0`) prior to release date.
   - **479 films (14.95%)** have **zero cast history** (`cast_past_films == 0`) among their top-3 billed actors.
   - This empirically confirms why replacing missing history with 0 past revenue and imputing hit rates with the overall prior (0.5621) alongside explicit experience counts (`*_past_films`) is essential for tree and linear learners.

2. **Extreme ROI Skewness & The Power of Low-Budget Horror:**
   - While the overall average ROI ratio is **11.13x**, the median ROI ratio is only **2.31x**, heavily influenced by micro-budget phenomena like *Paranormal Activity* (ROI **12,890.39x**).
   - **Horror** achieves the highest median ROI of any primary genre at **3.72x** with a hit rate of **77.5% (n=196)**, demonstrating why studios frequently finance low-risk, high-return genre titles.

3. **Animation Leads Commercial Viability Across High-Volume Genres:**
   - **Animation** achieves a remarkable **61.6% hit rate (n=99)** with a median ROI of **2.64x** and median budget of $76,000,000.
   - By comparison, **Action** has a hit rate of **49.7% (n=588)** with a lower median ROI of **1.98x**, despite commanding massive capital commitments.

4. **Seasonal Release Windows Influence Profitability:**
   - **Summer (May–July)** releases yield a **64.4% hit rate (n=798)** with a median ROI of **2.77x**.
   - **Holiday (Nov–Dec)** releases exhibit an even stronger **61.3% hit rate (n=587)**.
   - Conversely, **Dump Month (Jan–Feb)** releases drop to a **52.7% hit rate (n=414)** with median ROI of **2.11x**, confirming industry lore that studios reserve weak commercial prospects for late winter.

5. **Budget Tier Counter-Intuition (Hit Rate vs Return Multiplier):**
   - **High-budget movies** (top tertile, > $40.7M) post the highest hit rate at **55.1% (n=1068)**, but yield a modest median ROI of **2.19x**.
   - **Low-budget movies** (bottom tertile, < $15.0M) post a lower hit rate of **63.6% (n=1068)**, but deliver a substantially higher median ROI of **3.22x** when they succeed.

6. **Decadal Expansion and Blockbuster Inflation:**
   - Films from the **2000s (n=1324)** and **2010s (n=941)** constitute 79.8% of all cleaned titles.
   - The median production budget expanded from **$13,900,000** in the 1980s to **$30,000,000** in the 2000s and **$30,000,000** in the 2010s.

7. **Reception Signals Disproportionately Separate Hits from Flops:**
   - Mean `vote_average` for Hits is **6.51 / 10** vs **6.05 / 10** for Flops.
   - Mean `vote_count` for Hits is **1,401** compared to only **448** for Flops, confirming that post-release engagement provides a massive discriminative signal in Model B.

---

## 3. Presentation Figures Generated
- `report/figures/class_distribution.png`
- `report/figures/histograms_combined.png`
- `report/figures/hist_roi_clipped.png`
- `report/figures/hit_rates_genre.png`
- `report/figures/scatter_budget_vs_vote.png`
- `report/figures/scatter_star_vs_budget.png`
