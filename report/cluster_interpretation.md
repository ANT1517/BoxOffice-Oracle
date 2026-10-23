# Movie Market Segmentation & Cluster Analysis

**Model:** K-Means (Standardized Features, k-means++, seed=10) vs Agglomerative Hierarchical (Ward Linkage)  
**Dataset Size:** 3,204 films  
**Optimal Clusters Chosen:** **k = 3**  
**Features Used for Clustering:** `log_budget`, `runtime`, `cast_avg_past_revenue`, `dir_avg_past_revenue`, `vote_average`, `vote_count`, `popularity`.  
*(Target variables `label` and `roi_ratio` were strictly excluded from model fitting and used solely for post-hoc validation).*

---

## 1. Selection of k (Elbow & Silhouette Analysis)

The number of clusters $k$ was swept from $k = 2$ through $k = 8$:

| k | Within-Cluster SSE (Inertia) | Inertia Reduction ($\Delta$) | Silhouette Coefficient |
| :-: | :-: | :-: | :-: |
| **2** | 17,444.95 | — | 0.3229 |
| **3** | **14,993.44** | **-2,451.51 (-14.05%)** | **0.1939** |
| **4** | 13,363.78 | -1,629.66 (-10.87%) | 0.1807 |
| **5** | 12,146.50 | -1,217.28 (-9.11%) | 0.1928 |
| **6** | 11,116.57 | -1,029.93 (-8.48%) | 0.1908 |
| **7** | 10,215.89 | -900.68 (-8.10%) | 0.1763 |
| **8** | 9,626.62 | -589.27 (-5.77%) | 0.1775 |

> [!NOTE]
> **Cluster Structure Assessment:** Across all evaluated values of $k$, the silhouette coefficients are low (0.16–0.32), plainly indicating that the underlying feature space has weak, overlapping cluster boundaries rather than isolated natural clusters. While $k = 2$ achieves the highest silhouette coefficient (0.3229) by trivially bifurcating the data into high-engagement and low-engagement films, **$k = 3$ was chosen for practical domain interpretability**.

### Justification for k = 3:
1. **The Elbow Point:** The sharpest bend in within-cluster sum of squares occurs at $k = 3$, reducing inertia by **14.05%**, after which diminishing returns set in.
2. **Multi-Cluster Silhouette Peak:** At $k = 3$, the silhouette coefficient reaches **0.1939**, the highest score among all multi-cluster solutions ($k \ge 3$).
3. **Domain Interpretability:** As detailed below, $k = 3$ partitions the movie industry into three crisp, actionable market archetypes: Blockbusters, Mainstream Studio Bets, and Low-Budget Indie / Sleeper Releases.

---

## 2. Cluster Profiles & Centroid Analysis

| Cluster ID | Market Segment Name | Size (Share) | Hit Share | Median ROI | Avg Budget | Cast Past Rev | Audience Rating | Vote Count |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **0** | **High-Budget, High-Engagement Blockbusters** | 458 (14.29%) | **83.4%** | **3.75x** | $98,728,275 | $176.8M | 6.96 | 3,506 |
| **1** | **Mid-to-High Budget Mainstream / Risky Studio Releases** | 1,704 (53.18%) | **44.3%** | **1.75x** | $43,885,926 | $132.2M | 5.85 | 587 |
| **2** | **Low-Budget Indie / Sleeper Releases** | 1,042 (32.52%) | **63.7%** | **3.24x** | $10,721,610 | $43.5M | 6.79 | 525 |
| **All** | *Overall Industry Baseline* | 3,204 (100%) | 56.2% | 2.16x | $40,634,449 | $109.8M | 6.31 | 1,003 |

---

## 3. Segment Deep-Dives & Studio Strategy

### Segment 0: High-Budget, High-Engagement Blockbusters
- **Size & Share:** 458 films (14.29% of the market).
- **Profile:** Characterized by top-tier capital investments (average budget **$98,728,275**), proven superstar casting (average past cast revenue **$176.8M**), and massive post-release audience engagement (**3,506 votes** with **6.96** rating).
- **Commercial Outcome:** **83.4% Hit Share** with a strong **3.75x median ROI**.
- **Studio Reading:** The primary revenue generator for major studios. While expensive to manufacture, tentpoles with established IP and star director/actor pairings present high commercial certainty.

### Segment 1: Mid-to-High Budget Mainstream / Risky Studio Releases
- **Size & Share:** 1,704 films (53.18% of the market — the majority segment).
- **Profile:** Solid studio funding (average budget **$43,885,926**) and seasoned cast members ($132.2M), but moderate-to-poor reception (**5.85** rating) and modest engagement (**587 votes**).
- **Commercial Outcome:** **44.3% Hit Share** and a sub-break-even median ROI of **1.75x**.
- **Studio Reading:** The danger zone of Hollywood. Mid-budget dramas, comedies, and uninspired action films frequently fail to clear theatrical marketing and distributor hurdles. Studios should exercise tight cost controls or re-evaluate theatrical viability in favor of direct streaming.

### Segment 2: Low-Budget Indie / Sleeper Releases
- **Size & Share:** 1,042 films (32.52% of the market).
- **Profile:** Lean production costs (average budget **$10,721,610**, median **$7,000,000**) with newcomer or emerging talent (cast past revenue **$43.5M**). While audience rating is above baseline (**6.79** vs 6.31), the standardized delta is only +0.36 std, reflecting modest positive reception rather than overwhelming acclaim.
- **Commercial Outcome:** **63.7% Hit Share** and an impressive **3.24x median ROI**.
- **Studio Reading:** Asymmetric upside. Low-budget horror and auteur-driven indie titles minimize downside risk while providing outsized return multipliers when positive word-of-mouth takes hold.

---

## 4. Hierarchical Clustering Comparison & Validation

Hierarchical clustering was evaluated on a reproducible 300-film sample (`random_state = 1`):
- **Ward Linkage vs K-Means:** **Adjusted Rand Index (ARI) = 0.2452**
- **Average Linkage vs K-Means:** **ARI = 0.0322**
- **Complete Linkage vs K-Means:** **ARI = 0.024**

### Findings:
- **Ward's method** exhibits **weak-to-moderate agreement** with K-Means (ARI = 0.2452), reflecting the inherently fuzzy and overlapping cluster topology of film attributes.
- Average and Complete linkages yield negligible concordance (ARI $\le$ 0.03) due to extreme sensitivity to chaining and outliers in continuous feature distributions.
- Dendrogram visual inspections confirm three dominant macro-branches corresponding directly to the low-budget, mid-budget, and high-budget clusters identified by K-Means.
