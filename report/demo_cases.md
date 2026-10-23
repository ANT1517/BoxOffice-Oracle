# BoxOffice Oracle - Theatrical Commercial Validation & Demo Case Studies

This document records the empirical validation of the BoxOffice Oracle decision-support system across three distinct theatrical archetypes from the curated TMDB 5,000 dataset:
1. **Big-Budget Franchise Sequel Hit** (*Avengers: Age of Ultron*)
2. **Low-Budget Horror Sleeper Hit** (*Saw*) — *Honest Miss by Model A*
3. **Mid-Budget Original Studio Flop** (*Battlefield Earth*) — *Honest Miss by Model A*

All recorded probabilities represent rigorous **10-Fold Out-of-Fold (OOF)** cross-validation predictions, ensuring that predictions were made strictly on models that were never trained on the target film.

---

## Summary Comparison Matrix

| Film Archetype | Movie Title (Year) | Production Budget | Worldwide Revenue | Actual ROI | Actual Outcome | Model A (Pre-Release) OOF Prob | Model A Prediction | Model B (+ Reception) OOF Prob | Model B Prediction | Diagnostic Key Finding |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **(a) Big-Budget Sequel Hit** | **Avengers: Age of Ultron** (2015) | $280.0M | $1,405.4M | **5.02x** | **Hit** | **0.8021** (80.2%) | **Hit** (Correct) | **0.8892** (88.9%) | **Hit** (Correct) | Proven franchise IP, massive star track record, and prime summer corridor combine for high commercial certainty. |
| **(b) Low-Budget Horror Hit** | **Saw** (2004) | $1.2M | $103.9M | **86.59x** | **Hit** | **0.4208** (42.1%) | **Flop** (*Honest Miss*) | **0.8856** (88.6%) | **Hit** (Correct) | Debut indie release with newcomer director and zero past star revenue; Model B immediately corrects the miss once audience word-of-mouth is measured. |
| **(c) Mid-Budget Original Flop** | **Battlefield Earth** (2000) | $44.0M | $21.5M | **0.49x** | **Flop** | **0.6102** (61.0%) | **Hit** (*Honest Miss*) | **0.1664** (16.6%) | **Flop** (Correct) | False positive from pre-release star power (John Travolta); Model B drops by -44.4% to accurately diagnose catastrophic reception. |

---

## Detailed Case Analyses

### Case Study A: Big-Budget Sequel Hit
- **Title:** *Avengers: Age of Ultron* (2015)
- **TMDb ID:** `99861`
- **Primary Genre:** Action / Adventure / Science Fiction
- **Release Date:** April 22, 2015 (Pre-summer window)
- **Production Budget:** $280,000,000
- **Worldwide Box Office:** $1,405,403,694
- **Actual Theatrical ROI:** 5.02x (Clear Hit, well above 2.0x break-even)

#### Model Predictions & Probabilities:
- **Model A (Pre-Release):** `P(Hit) = 0.8021` (80.2%) &rarr; **Hit** [Low Commercial Risk]
- **Model B (+ Reception):** `P(Hit) = 0.8892` (88.9%) &rarr; **Hit** [Strong Hit]
- **Key Pre-Release Drivers:**
  - `franchise = 1`: Non-leaking sequence sequel within an established Marvel Cinematic Universe collection.
  - `cast_avg_past_revenue = $220.6M`: Lead ensemble cast (Robert Downey Jr., Chris Hemsworth, Chris Evans) possessing extensive multi-billion dollar commercial history.
  - `big_studio = 1`: Backed by Walt Disney / Marvel Studios global distribution apparatus.
- **Analytical Takeaway:** Mega-budget tentpoles with established IP exhibit high commercial resilience. Both Model A and Model B reliably flag the project as top-tier investment certainty.

---

### Case Study B: Low-Budget Horror Sleeper Hit (*Honest Miss by Model A*)
- **Title:** *Saw* (2004)
- **TMDb ID:** `176`
- **Primary Genre:** Horror / Mystery / Crime
- **Release Date:** October 1, 2004 (Pre-Halloween corridor)
- **Production Budget:** $1,200,000
- **Worldwide Box Office:** $103,911,669
- **Actual Theatrical ROI:** 86.59x (Legendary breakout Hit)

#### Model Predictions & Probabilities:
- **Model A (Pre-Release):** `P(Hit) = 0.4208` (42.1%) &rarr; **Flop** (*Honest Pre-Release Miss*)
- **Model B (+ Reception):** `P(Hit) = 0.8856` (88.6%) &rarr; **Hit** [Correct Classification]
- **Why Model A Missed:**
  - `dir_avg_past_revenue = $0`: Director James Wan was an unproven Australian newcomer making his feature directorial debut.
  - `cast_avg_past_revenue = $3.8M`: Indie cast (Cary Elwes, Leigh Whannell) without major studio marquee track records.
  - `franchise = 0`: Debut instalment of an unproven original concept.
  - `budget = $1.2M`: In pre-release regression trees, micro-budgets without stars carry high statistical variance. Model A prudently flagged the film as high-risk, assigning only a 42.1% probability.
- **Why Model B Corrected the Miss (+46.5% Probability Swing):**
  - Post-release reception revealed immediate grassroots buzz: `vote_average = 7.3`, `vote_count = 2,184` (exceptionally high engagement for a $1.2M investment).
  - Model B successfully integrated opening word-of-mouth, shifting probability from 42.1% to 88.6%.

---

### Case Study C: Mid-Budget Original Studio Flop (*Honest Miss by Model A*)
- **Title:** *Battlefield Earth* (2000)
- **TMDb ID:** `5491`
- **Primary Genre:** Science Fiction / Action
- **Release Date:** May 12, 2000 (Early summer corridor)
- **Production Budget:** $44,000,000
- **Worldwide Box Office:** $21,471,685
- **Actual Theatrical ROI:** 0.49x (Disastrous commercial collapse)

#### Model Predictions & Probabilities:
- **Model A (Pre-Release):** `P(Hit) = 0.6102` (61.0%) &rarr; **Hit** (*Honest Pre-Release Miss*)
- **Model B (+ Reception):** `P(Hit) = 0.1664` (16.6%) &rarr; **Flop** [Correct Classification]
- **Why Model A Missed (False Positive):**
  - `cast_avg_past_revenue = $154.2M`: John Travolta was riding high on a historic box-office streak (*Pulp Fiction*, *Get Shorty*, *Phenomenon*, *Face/Off*).
  - `budget = $44.0M`: Solid mid-budget studio funding released in the lucrative early May summer window.
  - Pre-release signals indicated a solid commercial vehicle; Model A predicted a 61.0% chance of clearing the $88M break-even hurdle.
- **Why Model B Corrected the Miss (-44.4% Probability Drop):**
  - Post-release reviews were historically negative: `vote_average = 3.0` (later 2.1 on TMDb), with high negative social sentiment and dismal attendance.
  - Model B's calibrated reception weights promptly dropped the probability down to 16.6%, correctly identifying the theatrical deficit.

---

## Strategic Decision-Support Takeaway for Film Studios

1. **Model A as Greenlight Underwriting:** Model A provides cold, objective actuarial odds based purely on capital structure, talent history, and scheduling. It guards against unwarranted optimism by flagging that star power alone does not guarantee a hit.
2. **Model B as Theatrical Windowing & Marketing Adjustment:** Model B incorporates opening-weekend audience signals. For films like *Saw*, a dramatic upward jump indicates immediate expansion opportunities (increasing screen counts and marketing spend). For films like *Battlefield Earth*, an immediate downward revision signals studios to cut secondary theatrical marketing and pull forward PVOD/streaming windowing to stem theatrical distribution losses.
