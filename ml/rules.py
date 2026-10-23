"""
ml/rules.py - Association Rule Mining engine for BoxOffice Oracle.
Uses mlxtend to extract Class Association Rules (CARs) via Apriori and FP-Growth.
Benchmarks execution times and generates rules.json and benchmark.json.
"""
import json
import os
import time
from typing import Any, Dict, List, Set, Tuple
from mlxtend.frequent_patterns import apriori, association_rules, fpgrowth
import numpy as np
import pandas as pd

NOMINAL_COLS = [
    "budget_tier", "primary_genre", "season", "runtime_bin",
    "star_tier", "director_tier", "franchise", "big_studio",
    "hype_level", "rating_band", "label"
]


def prepare_rules_dataframe(df: pd.DataFrame, prerelease_only: bool = False) -> pd.DataFrame:
    """Prepare nominal dataframe with mapped franchise/studio and one-hot encoding."""
    cols = [c for c in NOMINAL_COLS if c in df.columns]
    if prerelease_only:
        cols = [c for c in cols if c not in ("hype_level", "rating_band")]

    sub = df[cols].copy()
    if "franchise" in sub.columns:
        sub["franchise"] = sub["franchise"].map({1: "Franchise", 0: "Original"}).fillna("Original")
    if "big_studio" in sub.columns:
        sub["big_studio"] = sub["big_studio"].map({1: "BigStudio", 0: "Indie"}).fillna("Indie")

    # One-hot encode with boolean type
    onehot = pd.get_dummies(sub, prefix_sep="=", dtype=bool)
    return onehot


def format_rule_dict(row: pd.Series) -> Dict[str, Any]:
    """Format an association rule row into a clean dictionary."""
    ant_list = sorted(list(row["antecedents"]))
    con_str = list(row["consequents"])[0]

    uses_post = any("hype_level=" in item or "rating_band=" in item for item in ant_list)

    return {
        "antecedent": ant_list,
        "consequent": con_str,
        "support": round(float(row["support"]), 4),
        "confidence": round(float(row["confidence"]), 4),
        "lift": round(float(row["lift"]), 4),
        "uses_post_release": uses_post,
        "is_hit_rule": bool(con_str == "label=Hit"),
    }


def run_association_rules(
    clean_data_path: str = "artifacts/data/movies_clean.parquet",
    artifacts_rules_dir: str = "artifacts/rules",
    min_support: float = 0.03,
    min_confidence: float = 0.65,
    num_runs: int = 3,
):
    """
    Run Apriori and FP-Growth, benchmark execution time across multiple runs,
    verify that both produce identical rule sets, and export rules.json and benchmark.json.
    """
    os.makedirs(artifacts_rules_dir, exist_ok=True)
    print("=== Running Association Rule Mining (Apriori & FP-Growth) ===")

    df = pd.read_parquet(clean_data_path)
    onehot = prepare_rules_dataframe(df, prerelease_only=False)
    print(f"[rules] One-hot transaction matrix shape: {onehot.shape}")

    # 1. Benchmark Apriori across num_runs
    apriori_times = []
    ap_itemsets = None
    for i in range(num_runs):
        t0 = time.perf_counter()
        ap_itemsets = apriori(onehot, min_support=min_support, use_colnames=True)
        apriori_times.append(time.perf_counter() - t0)
    avg_apriori_time = float(np.mean(apriori_times))
    print(f"[benchmark] Apriori ({num_runs} runs): avg {avg_apriori_time:.4f}s | itemsets: {len(ap_itemsets)}")

    # 2. Benchmark FP-Growth across num_runs
    fpgrowth_times = []
    fp_itemsets = None
    for i in range(num_runs):
        t0 = time.perf_counter()
        fp_itemsets = fpgrowth(onehot, min_support=min_support, use_colnames=True)
        fpgrowth_times.append(time.perf_counter() - t0)
    avg_fpgrowth_time = float(np.mean(fpgrowth_times))
    print(f"[benchmark] FP-Growth ({num_runs} runs): avg {avg_fpgrowth_time:.4f}s | itemsets: {len(fp_itemsets)}")

    # 3. Derive rules for both
    ap_all_rules = association_rules(ap_itemsets, metric="confidence", min_threshold=min_confidence)
    fp_all_rules = association_rules(fp_itemsets, metric="confidence", min_threshold=min_confidence)

    # Filter for Class Association Rules (CARs: consequent is strictly label=Hit or label=Flop)
    valid_consequents = [frozenset({"label=Hit"}), frozenset({"label=Flop"})]
    ap_cars = ap_all_rules[ap_all_rules["consequents"].isin(valid_consequents)].copy()
    fp_cars = fp_all_rules[fp_all_rules["consequents"].isin(valid_consequents)].copy()

    # 4. Verification: confirm both algorithms produce identical rule sets
    def make_rule_key(row):
        return (tuple(sorted(list(row["antecedents"]))), tuple(sorted(list(row["consequents"]))))

    ap_keys = set(ap_cars.apply(make_rule_key, axis=1))
    fp_keys = set(fp_cars.apply(make_rule_key, axis=1))

    identical_rule_sets = bool(ap_keys == fp_keys)
    print(f"[verification] Apriori CAR count: {len(ap_cars)} | FP-Growth CAR count: {len(fp_cars)}")
    print(f"[verification] Identical rule sets produced: {identical_rule_sets}")

    # Sort rules by lift descending
    ap_cars = ap_cars.sort_values("lift", ascending=False).reset_index(drop=True)
    formatted_rules = [format_rule_dict(r) for _, r in ap_cars.iterrows()]

    # Separate top hit rules and top flop rules
    hit_rules = [r for r in formatted_rules if r["is_hit_rule"]]
    flop_rules = [r for r in formatted_rules if not r["is_hit_rule"]]

    # 5. Pre-release only rules (excluding hype_level and rating_band)
    print("[rules] Mining pre-release-only rules (excluding hype_level and rating_band)...")
    onehot_pre = prepare_rules_dataframe(df, prerelease_only=True)
    fi_pre = fpgrowth(onehot_pre, min_support=min_support, use_colnames=True)
    rules_pre_df = association_rules(fi_pre, metric="confidence", min_threshold=min_confidence)
    cars_pre = rules_pre_df[rules_pre_df["consequents"].isin(valid_consequents)].sort_values("lift", ascending=False)
    formatted_pre_rules = [format_rule_dict(r) for _, r in cars_pre.iterrows()]

    # 6. Benchmark at min_support = 0.01 (3 runs) to compare scaling behavior
    print("[benchmark] Running secondary benchmark at min_support=0.01 (3 runs)...")
    ap_times_01 = []
    ap_item_01 = None
    for _ in range(num_runs):
        t0 = time.perf_counter()
        ap_item_01 = apriori(onehot, min_support=0.01, use_colnames=True)
        ap_times_01.append(time.perf_counter() - t0)
    avg_ap_01 = float(np.mean(ap_times_01))

    fp_times_01 = []
    fp_item_01 = None
    for _ in range(num_runs):
        t0 = time.perf_counter()
        fp_item_01 = fpgrowth(onehot, min_support=0.01, use_colnames=True)
        fp_times_01.append(time.perf_counter() - t0)
    avg_fp_01 = float(np.mean(fp_times_01))

    # Verify parity at min_support = 0.01
    ap_all_01 = association_rules(ap_item_01, metric="confidence", min_threshold=min_confidence)
    fp_all_01 = association_rules(fp_item_01, metric="confidence", min_threshold=min_confidence)
    ap_cars_01 = ap_all_01[ap_all_01["consequents"].isin(valid_consequents)]
    fp_cars_01 = fp_all_01[fp_all_01["consequents"].isin(valid_consequents)]
    ap_keys_01 = set(ap_cars_01.apply(make_rule_key, axis=1))
    fp_keys_01 = set(fp_cars_01.apply(make_rule_key, axis=1))
    identical_01 = bool(ap_keys_01 == fp_keys_01)
    print(f"[benchmark] min_sup 0.01: Apriori avg {avg_ap_01:.4f}s | FP-Growth avg {avg_fp_01:.4f}s | Parity: {identical_01}")

    # 7. Save artifacts/rules/benchmark.json
    benchmark_data = {
        "dataset_rows": len(df),
        "onehot_columns": onehot.shape[1],
        "explanation": "FP-Growth beats Apriori when min_support is low or itemsets are long/dense, because Apriori suffers from candidate generation explosion (generating and checking O(2^k) candidates across repeated dataset scans), whereas FP-Growth compresses transactions into a prefix tree and mines patterns recursively via conditional FP-trees without candidate generation.",
        "benchmark_min_support_0_03": {
            "min_support": 0.03,
            "min_confidence": min_confidence,
            "num_runs": num_runs,
            "algorithms": {
                "apriori": {
                    "avg_time_seconds": round(avg_apriori_time, 4),
                    "times_seconds": [round(t, 4) for t in apriori_times],
                    "frequent_itemsets": len(ap_itemsets),
                    "total_rules": len(ap_all_rules),
                    "class_association_rules": len(ap_cars),
                },
                "fpgrowth": {
                    "avg_time_seconds": round(avg_fpgrowth_time, 4),
                    "times_seconds": [round(t, 4) for t in fpgrowth_times],
                    "frequent_itemsets": len(fp_itemsets),
                    "total_rules": len(fp_all_rules),
                    "class_association_rules": len(fp_cars),
                },
            },
            "verification": {
                "identical_rule_sets": identical_rule_sets,
                "discrepancy_count": len(ap_keys.symmetric_difference(fp_keys)),
            },
        },
        "benchmark_min_support_0_01": {
            "min_support": 0.01,
            "min_confidence": min_confidence,
            "num_runs": num_runs,
            "algorithms": {
                "apriori": {
                    "avg_time_seconds": round(avg_ap_01, 4),
                    "times_seconds": [round(t, 4) for t in ap_times_01],
                    "frequent_itemsets": len(ap_item_01),
                    "total_rules": len(ap_all_01),
                    "class_association_rules": len(ap_cars_01),
                },
                "fpgrowth": {
                    "avg_time_seconds": round(avg_fp_01, 4),
                    "times_seconds": [round(t, 4) for t in fp_times_01],
                    "frequent_itemsets": len(fp_item_01),
                    "total_rules": len(fp_all_01),
                    "class_association_rules": len(fp_cars_01),
                },
            },
            "verification": {
                "identical_rule_sets": identical_01,
                "discrepancy_count": len(ap_keys_01.symmetric_difference(fp_keys_01)),
            },
        },
        "min_support": min_support,
        "min_confidence": min_confidence,
        "num_runs": num_runs,
        "algorithms": {
            "apriori": {
                "avg_time_seconds": round(avg_apriori_time, 4),
                "times_seconds": [round(t, 4) for t in apriori_times],
                "frequent_itemsets": len(ap_itemsets),
                "total_rules": len(ap_all_rules),
                "class_association_rules": len(ap_cars),
            },
            "fpgrowth": {
                "avg_time_seconds": round(avg_fpgrowth_time, 4),
                "times_seconds": [round(t, 4) for t in fpgrowth_times],
                "frequent_itemsets": len(fp_itemsets),
                "total_rules": len(fp_all_rules),
                "class_association_rules": len(fp_cars),
            },
        },
        "verification": {
            "identical_rule_sets": identical_rule_sets,
            "discrepancy_count": len(ap_keys.symmetric_difference(fp_keys)),
        },
    }

    benchmark_path = os.path.join(artifacts_rules_dir, "benchmark.json")
    with open(benchmark_path, "w", encoding="utf-8") as f:
        json.dump(benchmark_data, f, indent=2)
    print(f"[export] Saved benchmark data: {benchmark_path}")

    # 7. Save artifacts/rules/rules.json
    rules_data = {
        "total_rules": len(formatted_rules),
        "hit_rules_count": len(hit_rules),
        "flop_rules_count": len(flop_rules),
        "prerelease_rules_count": len(formatted_pre_rules),
        "top_5_hit_rules": hit_rules[:5],
        "top_5_flop_rules": flop_rules[:5],
        "top_10_hit_rules": hit_rules[:10],
        "top_10_flop_rules": flop_rules[:10],
        "prerelease_top_10_rules": formatted_pre_rules[:10],
        "all_rules": formatted_rules,
        "prerelease_rules": formatted_pre_rules,
    }

    rules_path = os.path.join(artifacts_rules_dir, "rules.json")
    with open(rules_path, "w", encoding="utf-8") as f:
        json.dump(rules_data, f, indent=2)
    print(f"[export] Saved rules data ({len(formatted_rules)} CAR rules): {rules_path}")
    print("=== Association Rules Mining Complete! ===")


if __name__ == "__main__":
    run_association_rules()
