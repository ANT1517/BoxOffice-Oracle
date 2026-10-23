"""
ml/olap.py - Online Analytical Processing (OLAP) multidimensional cube engine.
Provides high-performance, pure functional olap_query engine supporting:
- Hierarchical dimensions (Time: year -> decade, month -> season)
- Categorical dimensions (Genre, Budget Tier, Studio, Franchise)
- Measures: count, hit_rate, median_roi, avg_roi, total_revenue, median_budget
- Precomputed canonical operations: roll-up, drill-down, slice, dice, pivot.
"""
import json
import os
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd


VALID_MEASURES = ["count", "hit_rate", "median_roi", "avg_roi", "total_revenue", "median_budget"]


def prepare_olap_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure all OLAP dimensions and helper fields are prepared."""
    data = df.copy()

    # Time dimension hierarchies
    if "release_year" not in data.columns and "release_date" in data.columns:
        data["release_year"] = pd.to_datetime(data["release_date"]).dt.year
    if "release_month" not in data.columns and "release_date" in data.columns:
        data["release_month"] = pd.to_datetime(data["release_date"]).dt.month

    data["decade"] = (data["release_year"] // 10 * 10).astype(str) + "s"

    if "season" not in data.columns:
        def season_fn(m):
            if m in (5, 6, 7): return "Summer"
            if m in (11, 12): return "Holiday"
            if m in (1, 2): return "Dump"
            return "Regular"
        data["season"] = data["release_month"].apply(season_fn)

    # Studio dimension (BigStudio vs Indie)
    if "studio_type" not in data.columns:
        if "big_studio" in data.columns:
            data["studio_type"] = data["big_studio"].map({1: "BigStudio", 0: "Indie"}).fillna("Indie")
        else:
            data["studio_type"] = "Indie"

    # Franchise dimension (Franchise vs Original)
    if "franchise_type" not in data.columns:
        if "franchise" in data.columns:
            data["franchise_type"] = data["franchise"].map({1: "Franchise", 0: "Original"}).fillna("Original")
        else:
            data["franchise_type"] = "Original"

    # Numeric indicator for hits
    data["is_hit"] = (data["label"] == "Hit").astype(int)
    return data


def compute_cell_metrics(sub: pd.DataFrame, requested_measures: List[str]) -> Dict[str, Any]:
    """Compute requested aggregated metrics for a subset of data."""
    count = len(sub)
    cell: Dict[str, Any] = {
        "count": count,
        "low_confidence": bool(count < 10),
        "small_sample": bool(count < 30),
    }

    if count == 0:
        for m in requested_measures:
            if m != "count":
                cell[m] = 0.0
        return cell

    hits = int(sub["is_hit"].sum())
    for m in requested_measures:
        if m == "count":
            cell["count"] = count
        elif m == "hit_rate":
            cell["hit_rate"] = round(hits / count, 4)
        elif m == "median_roi":
            cell["median_roi"] = round(float(sub["roi_ratio"].median()), 2)
        elif m == "avg_roi":
            cell["avg_roi"] = round(float(sub["roi_ratio"].mean()), 2)
        elif m == "total_revenue":
            cell["total_revenue"] = round(float(sub["revenue"].sum()), 2)
        elif m == "median_budget":
            cell["median_budget"] = round(float(sub["budget"].median()), 2)

    return cell


def olap_query(
    df: pd.DataFrame,
    measures: Optional[List[str]] = None,
    rows: Optional[Union[str, List[str]]] = None,
    cols: Optional[Union[str, List[str]]] = None,
    filters: Optional[Dict[str, Any]] = None,
    default_roi_measure: str = "median_roi",
) -> Dict[str, Any]:
    """
    Pure, fast multidimensional OLAP query engine over movie dataset.
    Supports slicing, dicing, roll-up, drill-down, and pivots.
    """
    data = prepare_olap_dataframe(df)

    if not measures:
        measures = ["count", "hit_rate", default_roi_measure]

    # Normalize rows and cols
    row_dims: List[str] = [rows] if isinstance(rows, str) else (rows or [])
    col_dims: List[str] = [cols] if isinstance(cols, str) else (cols or [])

    # Apply filters (slice / dice)
    applied_filters: Dict[str, Any] = {}
    if filters:
        for k, v in filters.items():
            if k in data.columns:
                applied_filters[k] = v
                if isinstance(v, (list, set, tuple)):
                    data = data[data[k].isin(v)]
                else:
                    data = data[data[k] == v]

    # Validate dimensions
    all_dims = row_dims + col_dims
    for d in all_dims:
        if d not in data.columns:
            raise ValueError(f"Unknown OLAP dimension: '{d}'. Available: {list(data.columns)}")

    # Case 1: 1D query (only rows, no cols)
    if row_dims and not col_dims:
        result_rows = []
        for key, grp in data.groupby(row_dims if len(row_dims) > 1 else row_dims[0], sort=True):
            key_dict = {}
            if len(row_dims) == 1:
                key_dict[row_dims[0]] = str(key)
            else:
                for d_idx, d_name in enumerate(row_dims):
                    key_dict[d_name] = str(key[d_idx])

            cell = compute_cell_metrics(grp, measures)
            cell.update(key_dict)
            result_rows.append(cell)

        return {
            "type": "1D_table",
            "rows": row_dims,
            "cols": [],
            "measures": measures,
            "filters": applied_filters,
            "total_movies": len(data),
            "data": result_rows,
        }

    # Case 2: 2D Matrix / Pivot table (rows and cols)
    elif row_dims and col_dims:
        row_key = row_dims if len(row_dims) > 1 else row_dims[0]
        col_key = col_dims if len(col_dims) > 1 else col_dims[0]

        # Extract unique row and col values
        row_groups = data.groupby(row_key, sort=True)
        col_values = sorted([str(x) for x in data[col_key].unique()]) if len(col_dims) == 1 else []

        matrix_records = []
        for r_name, r_grp in row_groups:
            row_header: Dict[str, Any] = {}
            if len(row_dims) == 1:
                row_header[row_dims[0]] = str(r_name)
            else:
                for d_idx, d_name in enumerate(row_dims):
                    row_header[d_name] = str(r_name[d_idx])

            # For each column value, compute cell metrics
            cols_data: Dict[str, Any] = {}
            for c_val in col_values:
                sub = r_grp[r_grp[col_dims[0]].astype(str) == c_val]
                cols_data[c_val] = compute_cell_metrics(sub, measures)

            # Also compute row total
            cols_data["_Total"] = compute_cell_metrics(r_grp, measures)

            matrix_records.append({
                "row": row_header,
                "values": cols_data,
            })

        # Compute column totals
        col_totals: Dict[str, Any] = {}
        for c_val in col_values:
            sub = data[data[col_dims[0]].astype(str) == c_val]
            col_totals[c_val] = compute_cell_metrics(sub, measures)
        col_totals["_Total"] = compute_cell_metrics(data, measures)

        return {
            "type": "2D_pivot",
            "rows": row_dims,
            "cols": col_dims,
            "col_headers": col_values + ["_Total"],
            "measures": measures,
            "filters": applied_filters,
            "total_movies": len(data),
            "matrix": matrix_records,
            "totals": col_totals,
        }

    # Case 3: Global Aggregation
    else:
        global_cell = compute_cell_metrics(data, measures)
        return {
            "type": "scalar",
            "measures": measures,
            "filters": applied_filters,
            "total_movies": len(data),
            "metrics": global_cell,
        }


def precompute_olap_presets(
    clean_data_path: str = "artifacts/data/movies_clean.parquet",
    artifacts_olap_dir: str = "artifacts/olap",
):
    """
    Precompute the 5 canonical OLAP operations described in Master Reference:
    1. Roll-up: Hit rate & median ROI by release_year -> rolled up to decade
    2. Drill-down: Decade 2000s -> individual years (2000-2009); season -> month
    3. Slice: Fix genre = Action; show hit rate by budget_tier x decade
    4. Dice: primary_genre in {Action, Horror, Comedy} & season in {Summer, Holiday} & budget_tier in {Low, High}
    5. Pivot: genre x budget_tier <-> budget_tier x genre
    """
    os.makedirs(artifacts_olap_dir, exist_ok=True)
    print("=== Precomputing Canonical OLAP Operations ===")
    df = pd.read_parquet(clean_data_path)

    standard_measures = ["count", "hit_rate", "median_roi", "avg_roi", "median_budget"]

    # 1. ROLL-UP: Hit rate by year rolled up to decade
    print("[olap] 1. Computing Roll-up (Year -> Decade)...")
    rollup_decade = olap_query(df, measures=standard_measures, rows="decade")
    rollup_year = olap_query(df, measures=standard_measures, rows="release_year")
    rollup_data = {
        "operation": "Roll-up",
        "description": "Aggregation moving up the Time hierarchy from release_year to decade.",
        "coarse_level_decade": rollup_decade,
        "fine_level_year": rollup_year,
    }
    with open(os.path.join(artifacts_olap_dir, "rollup.json"), "w", encoding="utf-8") as f:
        json.dump(rollup_data, f, indent=2)

    # 2. DRILL-DOWN: Decade 2000s -> individual years (2000-2009) & Season -> Month
    print("[olap] 2. Computing Drill-down (2000s -> Years & Season -> Months)...")
    drilldown_2000s = olap_query(
        df,
        measures=standard_measures,
        rows="release_year",
        filters={"decade": "2000s"},
    )
    drilldown_season = olap_query(
        df,
        measures=standard_measures,
        rows=["season", "release_month"],
    )
    drilldown_data = {
        "operation": "Drill-down",
        "description": "Decomposition moving down the Time hierarchy into individual years (2000-2009) and months.",
        "years_2000s": drilldown_2000s,
        "season_to_month": drilldown_season,
    }
    with open(os.path.join(artifacts_olap_dir, "drilldown.json"), "w", encoding="utf-8") as f:
        json.dump(drilldown_data, f, indent=2)

    # 3. SLICE: Fix genre = Action; show hit rate by budget_tier x decade
    print("[olap] 3. Computing Slice (genre = Action)...")
    slice_action = olap_query(
        df,
        measures=standard_measures,
        rows="budget_tier",
        cols="decade",
        filters={"primary_genre": "Action"},
    )
    slice_data = {
        "operation": "Slice",
        "description": "Fixing the Genre dimension to 'Action', analyzing budget_tier across decades.",
        "slice_action": slice_action,
    }
    with open(os.path.join(artifacts_olap_dir, "slice.json"), "w", encoding="utf-8") as f:
        json.dump(slice_data, f, indent=2)

    # 4. DICE: primary_genre in {Action, Horror, Comedy} & season in {Summer, Holiday} & budget_tier in {Low, High}
    print("[olap] 4. Computing Dice (Action, Horror, Comedy x Summer, Holiday x Low, High)...")
    dice_result = olap_query(
        df,
        measures=standard_measures,
        rows=["primary_genre", "season"],
        cols="budget_tier",
        filters={
            "primary_genre": ["Action", "Horror", "Comedy"],
            "season": ["Summer", "Holiday"],
            "budget_tier": ["Low", "High"],
        },
    )
    dice_data = {
        "operation": "Dice",
        "description": "Sub-cube selection filtering specific subsets of Genre, Season, and Budget tiers.",
        "dice_result": dice_result,
    }
    with open(os.path.join(artifacts_olap_dir, "dice.json"), "w", encoding="utf-8") as f:
        json.dump(dice_data, f, indent=2)

    # 5. PIVOT: genre x budget_tier <-> budget_tier x genre
    print("[olap] 5. Computing Pivot (Genre x Budget Tier <-> Budget Tier x Genre)...")
    pivot_normal = olap_query(
        df,
        measures=standard_measures,
        rows="primary_genre",
        cols="budget_tier",
    )
    pivot_rotated = olap_query(
        df,
        measures=standard_measures,
        rows="budget_tier",
        cols="primary_genre",
    )
    pivot_data = {
        "operation": "Pivot",
        "description": "Rotation of data cube axes: Genre x Budget Tier swapped to Budget Tier x Genre.",
        "normal_genre_by_budget": pivot_normal,
        "rotated_budget_by_genre": pivot_rotated,
    }
    with open(os.path.join(artifacts_olap_dir, "pivot.json"), "w", encoding="utf-8") as f:
        json.dump(pivot_data, f, indent=2)

    # 6. Combined presets.json for backend and frontend
    presets_data = {
        "presets": {
            "rollup": rollup_data,
            "drilldown": drilldown_data,
            "slice": slice_data,
            "dice": dice_data,
            "pivot": pivot_data,
        }
    }
    with open(os.path.join(artifacts_olap_dir, "presets.json"), "w", encoding="utf-8") as f:
        json.dump(presets_data, f, indent=2)

    print(f"[export] Precomputed OLAP artifacts written to: {artifacts_olap_dir}")
    print("=== OLAP Precomputations Complete! ===")


if __name__ == "__main__":
    precompute_olap_presets()
