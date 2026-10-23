"""
ml/clean.py - Data cleaning and filtering module for BoxOffice Oracle.
Applies data quality rules R1 through R9 from the Master Reference.
"""
import ast
import json
import os
import re
from typing import Callable, List, Optional, Tuple
import numpy as np
import pandas as pd

HIT_RATIO = 2.0       # Hit <=> revenue >= 2 x budget
MIN_MONEY = 10_000    # Budgets/revenues below this are treated as invalid
TOP_CAST = 3          # Lead actors used for star-power features
TOP_GENRES = [
    "Action", "Adventure", "Animation", "Comedy", "Crime", "Drama",
    "Family", "Fantasy", "Horror", "Romance", "Science Fiction", "Thriller"
]


def parse_json_list(s, key: str = "name") -> List[str]:
    """Parse stringified JSON or python-eval list of dictionaries."""
    if pd.isna(s) or s in ("", "[]"):
        return []
    items = None
    if isinstance(s, list):
        items = s
    elif isinstance(s, str):
        try:
            items = json.loads(s)
        except (ValueError, TypeError):
            try:
                items = ast.literal_eval(s)
            except (ValueError, SyntaxError):
                return []
    elif isinstance(s, dict):
        items = [s]

    if not items:
        return []

    results = []
    for it in items:
        if isinstance(it, dict) and it.get(key) is not None:
            results.append(it[key])
        elif isinstance(it, str):
            results.append(it)
    return results


def extract_director(crew_val) -> Optional[str]:
    """Extract director name from crew list."""
    if pd.isna(crew_val) or crew_val in ("", "[]"):
        return None
    items = []
    if isinstance(crew_val, list):
        items = crew_val
    elif isinstance(crew_val, str):
        try:
            items = json.loads(crew_val)
        except (ValueError, TypeError):
            try:
                items = ast.literal_eval(crew_val)
            except (ValueError, SyntaxError):
                return None
    for p in items:
        if isinstance(p, dict) and p.get("job") == "Director":
            return p.get("name")
    return None


def clean_movies_data(
    data_dir: str = "data",
    log_callback: Optional[Callable[[str], None]] = None
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Load raw CSVs, apply rules R1-R9, compute target, descriptors, and franchise flag.
    Returns the cleaned DataFrame and cleaning log lines.
    """
    log: List[str] = []

    def L(msg: str):
        log.append(msg)
        if log_callback:
            log_callback(msg)

    # 1. Load + Merge
    movies_path = os.path.join(data_dir, "tmdb_5000_movies.csv")
    credits_path = os.path.join(data_dir, "tmdb_5000_credits.csv")
    movies = pd.read_csv(movies_path)
    credits = pd.read_csv(credits_path)
    credits = credits.rename(columns={"movie_id": "id"}).drop(columns=["title"], errors="ignore")
    df = movies.merge(credits, on="id", how="left")
    L(f"[load] movies={len(movies)} credits={len(credits)} merged={len(df)}")

    # 2. Cleaning (R1-R6)
    n0 = len(df)
    df = df.drop_duplicates(subset="id")
    L(f"[clean] duplicates removed: {n0 - len(df)}")

    if "status" in df.columns:
        n0 = len(df)
        df = df[df["status"] == "Released"]
        L(f"[clean] not-released removed: {n0 - len(df)}")

    df["release_date"] = pd.to_datetime(df["release_date"], errors="coerce")
    n0 = len(df)
    df = df[df["release_date"].notna()]
    L(f"[clean] missing release_date removed: {n0 - len(df)}")

    n_bad_budget = int((df["budget"] < MIN_MONEY).sum())
    n_bad_rev = int((df["revenue"] < MIN_MONEY).sum())
    n0 = len(df)
    df = df[(df["budget"] >= MIN_MONEY) & (df["revenue"] >= MIN_MONEY)].copy()
    L(
        f"[clean] invalid budget rows={n_bad_budget}, invalid revenue rows={n_bad_rev}, "
        f"removed together: {n0 - len(df)}  -> remaining {len(df)}"
    )

    df.loc[df["runtime"] <= 0, "runtime"] = np.nan
    n_rt = int(df["runtime"].isna().sum())
    runtime_median = float(df["runtime"].median())
    df["runtime"] = df["runtime"].fillna(runtime_median)
    L(f"[clean] runtime missing/zero imputed with median: {n_rt}")

    # 3. Target
    df["roi_ratio"] = df["revenue"] / df["budget"]
    df["label"] = np.where(df["roi_ratio"] >= HIT_RATIO, "Hit", "Flop")
    df["label3"] = pd.cut(
        df["roi_ratio"],
        [-np.inf, 1.0, 2.5, np.inf],
        labels=["Flop", "Average", "Hit"]
    ).astype(str)
    L(f"[target] Hit/Flop counts: {df['label'].value_counts().to_dict()}")
    L(f"[target] 3-class counts: {df['label3'].value_counts().to_dict()}")

    # 4. Descriptors
    df["genres_list"] = df["genres"].apply(parse_json_list)
    df["primary_genre"] = df["genres_list"].apply(lambda g: g[0] if g else "Unknown")
    df["n_genres"] = df["genres_list"].apply(len)
    for g in TOP_GENRES:
        df["g_" + g.replace(" ", "_")] = df["genres_list"].apply(lambda lst, g=g: int(g in lst))

    df["companies"] = df["production_companies"].apply(parse_json_list)
    top_companies = list(pd.Series([c for lst in df["companies"] for c in lst]).value_counts().head(10).index)
    df["big_studio"] = df["companies"].apply(lambda lst: int(any(c in top_companies for c in lst)))
    df["is_english"] = (df["original_language"] == "en").astype(int)

    df["release_year"] = df["release_date"].dt.year
    df["release_month"] = df["release_date"].dt.month

    def season(m):
        if m in (5, 6, 7):
            return "Summer"
        if m in (11, 12):
            return "Holiday"
        if m in (1, 2):
            return "Dump"
        return "Regular"

    df["season"] = df["release_month"].apply(season)
    df["holiday_flag"] = df["release_month"].isin([11, 12]).astype(int)

    # 5. Franchise flag (Zero-leakage: first instalment is NOT a franchise, requires strictly earlier film in collection)
    from ml.features import compute_franchise_flag, parse_collection_history
    df["keywords_list"] = df["keywords"].apply(parse_json_list) if "keywords" in df.columns else [[]] * len(df)
    meta_path = os.path.join(data_dir, "movies_metadata.csv")
    coll_dates = parse_collection_history(meta_path)

    if os.path.exists(meta_path) and coll_dates:
        meta = pd.read_csv(meta_path, low_memory=False, usecols=["id", "belongs_to_collection"])
        meta["id"] = pd.to_numeric(meta["id"], errors="coerce")
        meta = meta.dropna(subset=["id"]).drop_duplicates(subset=["id"]).copy()
        meta["id"] = meta["id"].astype(int)

        def parse_coll_id(val):
            if pd.isna(val) or val in ("", "[]"):
                return None
            try:
                d = json.loads(val)
                if isinstance(d, dict) and "id" in d:
                    return int(d["id"])
            except (ValueError, TypeError):
                try:
                    d = ast.literal_eval(val)
                    if isinstance(d, dict) and "id" in d:
                        return int(d["id"])
                except (ValueError, SyntaxError):
                    return None
            return None

        meta["coll_id"] = meta["belongs_to_collection"].apply(parse_coll_id)
        df = df.merge(meta[["id", "coll_id"]], on="id", how="left")
        L(f"[franchise] non-leaking collection sequel flag computed from movies_metadata.csv ({len(meta)} rows, {len(coll_dates)} collections)")
    else:
        df["coll_id"] = None
        L("[franchise] movies_metadata.csv not found - using keyword/title heuristic only")

    # Compute franchise using shared compute_franchise_flag function (no 'based on comic')
    franchise_flags = []
    for _, r in df.iterrows():
        f = compute_franchise_flag(
            movie_id=int(r["id"]),
            release_date=r["release_date"],
            coll_id=r["coll_id"],
            keywords=r["keywords_list"],
            title=str(r["title"]),
            coll_dates=coll_dates,
        )
        franchise_flags.append(f)
    df["franchise"] = franchise_flags
    df.drop(columns=["coll_id"], inplace=True)

    # Cast list & director
    df["cast_list"] = df["cast"].apply(parse_json_list).apply(lambda c: c[:TOP_CAST])
    df["director"] = df["crew"].apply(extract_director)

    df = df.sort_values("release_date").reset_index(drop=True)
    return df, log
