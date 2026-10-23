"""
ml/features.py - Feature engineering engine for BoxOffice Oracle.
Shared by offline training and online serving (backend API).
Ensures zero-leakage star power and unified feature transformations.
"""
from typing import Any, Dict, List, Optional, Tuple, Union
import ast
import json
import os
import re
import numpy as np
import pandas as pd
from ml.clean import TOP_GENRES, parse_json_list

MODEL_A_PREDICTORS = [
    "log_budget",
    "runtime",
    "n_genres",
    "is_english",
    "big_studio",
    "franchise",
    "release_month",
    "holiday_flag",
    "cast_avg_past_revenue",
    "cast_past_hit_rate",
    "cast_past_films",
    "dir_avg_past_revenue",
    "dir_past_hit_rate",
    "dir_past_films",
    "primary_genre",
    "season",
]

MODEL_B_PREDICTORS = MODEL_A_PREDICTORS + [
    "vote_average",
    "vote_count",
    "popularity",
]

ALL_FEATURE_COLS = [
    "id", "title", "release_date", "release_year", "budget", "revenue", "roi_ratio",
    "label", "label3", "primary_genre", "n_genres", "runtime", "is_english",
    "big_studio", "franchise", "release_month", "season", "holiday_flag",
    "cast_avg_past_revenue", "cast_past_hit_rate", "cast_past_films",
    "dir_avg_past_revenue", "dir_past_hit_rate", "dir_past_films",
    "budget_tier", "runtime_bin", "star_tier", "director_tier",
    "hype_level", "rating_band", "vote_average", "vote_count",
    "popularity", "log_budget", "director"
] + ["g_" + g.replace(" ", "_") for g in TOP_GENRES]


def compute_season(month: int) -> str:
    """Return season category from calendar month."""
    if month in (5, 6, 7):
        return "Summer"
    if month in (11, 12):
        return "Holiday"
    if month in (1, 2):
        return "Dump"
    return "Regular"


def compute_holiday_flag(month: int) -> int:
    """Return 1 if release is in holiday window (Nov or Dec), else 0."""
    return 1 if month in (11, 12) else 0


def compute_genre_descriptors(genres: List[str]) -> Tuple[str, int, Dict[str, int]]:
    """Compute primary genre, total genres count, and binary flags for TOP_GENRES."""
    primary = genres[0] if genres else "Unknown"
    n_gen = len(genres)
    flags = {"g_" + g.replace(" ", "_"): int(g in genres) for g in TOP_GENRES}
    return primary, n_gen, flags


def compute_big_studio(companies: List[str], top_companies: List[str]) -> int:
    """Check if any company is among top-10 production studios."""
    return int(any(c in top_companies for c in companies))


def parse_collection_history(meta_path: str = "data/movies_metadata.csv") -> Dict[int, List[Tuple[int, pd.Timestamp]]]:
    """
    Parse belongs_to_collection from movies_metadata.csv across all 45k rows.
    Returns mapping from collection_id -> list of (movie_id, release_date).
    """
    if not os.path.exists(meta_path):
        return {}
    meta = pd.read_csv(meta_path, low_memory=False, usecols=["id", "title", "release_date", "belongs_to_collection"])
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
    meta["release_date_parsed"] = pd.to_datetime(meta["release_date"], errors="coerce")

    coll_dates: Dict[int, List[Tuple[int, pd.Timestamp]]] = {}
    for _, r in meta[meta["coll_id"].notna() & meta["release_date_parsed"].notna()].iterrows():
        cid = int(r["coll_id"])
        coll_dates.setdefault(cid, []).append((int(r["id"]), r["release_date_parsed"]))
    return coll_dates


def compute_franchise_flag(
    movie_id: int,
    release_date: pd.Timestamp,
    coll_id: Optional[int],
    keywords: List[str],
    title: str,
    coll_dates: Dict[int, List[Tuple[int, pd.Timestamp]]],
) -> int:
    """
    Non-leaking franchise computation:
    - franchise = 1 ONLY if the film belongs to a collection AND at least one other film
      in that collection has a strictly earlier release_date (i.e. a sequel/later instalment).
      The first instalment = 0.
    - Heuristics: keywords ("sequel", "remake") and title numerals/Part.
      "based on comic" is dropped (source material, not a franchise).
    """
    is_coll_sequel = 0
    if coll_id is not None and not pd.isna(coll_id):
        cid = int(coll_id)
        dates = coll_dates.get(cid, [])
        for other_id, other_dt in dates:
            if other_id != movie_id and other_dt < release_date:
                is_coll_sequel = 1
                break

    has_seq_kw = int(any(w in ("sequel", "remake") for w in keywords))
    has_title_seq = int(bool(re.search(r"\b(?:2|3|4|5|II|III|IV|Part)\b", title)))
    return int((is_coll_sequel + has_seq_kw + has_title_seq) > 0)


def compute_star_power(
    cast_list: List[str],
    director: Optional[str],
    release_date: pd.Timestamp,
    history: Dict[Tuple[str, str], List[Dict[str, Any]]],
    global_prior: float,
) -> Dict[str, Union[float, int]]:
    """
    Compute star-power features using STRICTLY films released prior to release_date.
    No leakage: movies released on or after release_date are never included.
    """
    # 1. Cast star power
    cast_past = []
    for actor in cast_list:
        recs = history.get(("A", actor), [])
        for r in recs:
            if r["release_date"] < release_date:
                cast_past.append(r)

    if cast_past:
        cast_avg_rev = float(np.mean([p["revenue"] for p in cast_past]))
        cast_hit_rt = float(np.mean([p["is_hit"] for p in cast_past]))
        cast_exp = len(cast_past)
    else:
        cast_avg_rev = 0.0
        cast_hit_rt = float(global_prior)
        cast_exp = 0

    # 2. Director star power
    dir_past = []
    if director:
        recs = history.get(("D", director), [])
        for r in recs:
            if r["release_date"] < release_date:
                dir_past.append(r)

    if dir_past:
        dir_avg_rev = float(np.mean([p["revenue"] for p in dir_past]))
        dir_hit_rt = float(np.mean([p["is_hit"] for p in dir_past]))
        dir_exp = len(dir_past)
    else:
        dir_avg_rev = 0.0
        dir_hit_rt = float(global_prior)
        dir_exp = 0

    return {
        "cast_avg_past_revenue": cast_avg_rev,
        "cast_past_hit_rate": cast_hit_rt,
        "cast_past_films": cast_exp,
        "dir_avg_past_revenue": dir_avg_rev,
        "dir_past_hit_rate": dir_hit_rt,
        "dir_past_films": dir_exp,
    }


def compute_runtime_bin(runtime: float) -> str:
    """Bin runtime into Short (<=95), Standard (95-120), or Long (>120)."""
    if runtime <= 95:
        return "Short"
    elif runtime <= 120:
        return "Standard"
    else:
        return "Long"


def compute_rating_band(vote_average: float) -> str:
    """Bin vote_average into Poor (<=5.5), Mixed (5.5-6.5), Good (6.5-7.2), Great (>7.2)."""
    if vote_average <= 5.5:
        return "Poor"
    elif vote_average <= 6.5:
        return "Mixed"
    elif vote_average <= 7.2:
        return "Good"
    else:
        return "Great"


def compute_tertile_bin(val: float, cutoffs: Tuple[float, float], labels: List[str]) -> str:
    """Assign value to Low, Medium, High given 33% and 66% cutoffs."""
    if val <= cutoffs[0]:
        return labels[0]
    elif val <= cutoffs[1]:
        return labels[1]
    else:
        return labels[2]


class FeatureContext:
    """Holds shared training-derived context for single-movie and batch serving."""

    def __init__(
        self,
        top_companies: List[str],
        global_prior: float,
        median_runtime: float,
        history: Dict[Tuple[str, str], List[Dict[str, Any]]],
        tertile_cutoffs: Dict[str, Tuple[float, float]],
    ):
        self.top_companies = top_companies
        self.global_prior = global_prior
        self.median_runtime = median_runtime
        self.history = history
        self.tertile_cutoffs = tertile_cutoffs


def build_batch_features(
    df: pd.DataFrame,
    log_callback: Optional[Any] = None
) -> Tuple[pd.DataFrame, FeatureContext, List[str]]:
    """
    Compute features for the entire cleaned dataset matching docs/prepare_movies.py exactly.
    Constructs the shared FeatureContext and history for online serving.
    """
    log: List[str] = []

    def L(msg: str):
        log.append(msg)
        if log_callback:
            log_callback(msg)

    # 1. Sort strictly by release date
    df = df.sort_values("release_date").reset_index(drop=True)

    # 2. Extract companies and top 10
    top_companies = list(
        pd.Series([c for lst in df["companies"] for c in lst])
        .value_counts()
        .head(10)
        .index
    )

    # 3. Global hit rate prior
    prior = float((df["label"] == "Hit").mean())
    median_runtime = float(df["runtime"].median())

    # 4. Leakage-safe star power loop
    hist: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
    cast_rev, cast_hit, cast_exp, dir_rev, dir_hit, dir_exp = ([] for _ in range(6))

    for _, grp in df.groupby("release_date", sort=True):
        # Compute features for every film on this date from STRICTLY earlier films
        for _, r in grp.iterrows():
            past = [h for a in r["cast_list"] for h in hist.get(("A", a), [])]
            cast_rev.append(np.mean([p["revenue"] for p in past]) if past else np.nan)
            cast_hit.append(np.mean([p["is_hit"] for p in past]) if past else np.nan)
            cast_exp.append(len(past))

            dp = hist.get(("D", r["director"]), []) if r["director"] else []
            dir_rev.append(np.mean([p["revenue"] for p in dp]) if dp else np.nan)
            dir_hit.append(np.mean([p["is_hit"] for p in dp]) if dp else np.nan)
            dir_exp.append(len(dp))

        # Then add this date's films to history
        for _, r in grp.iterrows():
            rec = {
                "title": r.get("title", ""),
                "release_date": r["release_date"],
                "revenue": float(r["revenue"]),
                "budget": float(r["budget"]),
                "is_hit": int(r["label"] == "Hit"),
            }
            for a in r["cast_list"]:
                hist.setdefault(("A", a), []).append(rec)
            if r["director"]:
                hist.setdefault(("D", r["director"]), []).append(rec)

    df["cast_avg_past_revenue"] = cast_rev
    df["cast_past_hit_rate"] = cast_hit
    df["cast_past_films"] = cast_exp
    df["dir_avg_past_revenue"] = dir_rev
    df["dir_past_hit_rate"] = dir_hit
    df["dir_past_films"] = dir_exp

    # Newcomers: fill missing with 0 / global prior
    df["cast_avg_past_revenue"] = df["cast_avg_past_revenue"].fillna(0.0)
    df["dir_avg_past_revenue"] = df["dir_avg_past_revenue"].fillna(0.0)
    df["cast_past_hit_rate"] = df["cast_past_hit_rate"].fillna(prior)
    df["dir_past_hit_rate"] = df["dir_past_hit_rate"].fillna(prior)

    L(
        f"[star] films with no cast history: {int((df['cast_past_films'] == 0).sum())}, "
        f"no director history: {int((df['dir_past_films'] == 0).sum())}"
    )

    # 5. Tiers / bins (matching prepare_movies.py)
    def tertile(s, labels):
        return pd.qcut(s.rank(method="first"), 3, labels=labels).astype(str)

    df["budget_tier"] = tertile(df["budget"], ["Low", "Medium", "High"])
    df["runtime_bin"] = pd.cut(
        df["runtime"], [0, 95, 120, 1000], labels=["Short", "Standard", "Long"]
    ).astype(str)
    df["star_tier"] = tertile(df["cast_avg_past_revenue"], ["LowStar", "MidStar", "HighStar"])
    df["director_tier"] = tertile(df["dir_avg_past_revenue"], ["LowDir", "MidDir", "HighDir"])
    df["hype_level"] = tertile(df["vote_count"], ["LowHype", "MidHype", "HighHype"])
    df["rating_band"] = pd.cut(
        df["vote_average"],
        [-1, 5.5, 6.5, 7.2, 11],
        labels=["Poor", "Mixed", "Good", "Great"],
    ).astype(str)
    df["log_budget"] = np.log10(df["budget"])

    # Compute cutoffs for serving
    tertile_cutoffs = {
        "budget": (float(df["budget"].quantile(1 / 3)), float(df["budget"].quantile(2 / 3))),
        "star": (float(df["cast_avg_past_revenue"].quantile(1 / 3)), float(df["cast_avg_past_revenue"].quantile(2 / 3))),
        "director": (float(df["dir_avg_past_revenue"].quantile(1 / 3)), float(df["dir_avg_past_revenue"].quantile(2 / 3))),
        "hype": (float(df["vote_count"].quantile(1 / 3)), float(df["vote_count"].quantile(2 / 3))),
    }

    context = FeatureContext(
        top_companies=top_companies,
        global_prior=prior,
        median_runtime=median_runtime,
        history=hist,
        tertile_cutoffs=tertile_cutoffs,
    )

    keep_cols = [c for c in ALL_FEATURE_COLS if c in df.columns]
    return df[keep_cols], context, log


def build_single_movie_features(
    movie_input: Dict[str, Any],
    context: FeatureContext
) -> Dict[str, Any]:
    """
    Build features for a single movie using the EXACT same logic as batch mode.
    Used by the FastAPI backend to build inference and what-if features.
    """
    # 1. Parse budget & log_budget
    budget = float(movie_input.get("budget", 0.0))
    log_budget = float(np.log10(budget)) if budget > 0 else 0.0

    # 2. Parse release date & timing
    raw_date = movie_input.get("release_date")
    release_date = pd.to_datetime(raw_date) if raw_date else pd.Timestamp("2026-01-01")
    release_year = int(release_date.year)
    release_month = int(release_date.month)
    season = compute_season(release_month)
    holiday_flag = compute_holiday_flag(release_month)

    # 3. Runtime
    runtime_val = movie_input.get("runtime")
    if runtime_val is None or float(runtime_val) <= 0:
        runtime = context.median_runtime
    else:
        runtime = float(runtime_val)
    runtime_bin = compute_runtime_bin(runtime)

    # 4. Genres
    raw_genres = movie_input.get("genres", [])
    if isinstance(raw_genres, str):
        genres_list = parse_json_list(raw_genres)
    else:
        genres_list = list(raw_genres)
    primary_genre, n_genres, genre_flags = compute_genre_descriptors(genres_list)

    # 5. Production Companies & Studio
    raw_companies = movie_input.get("production_companies", [])
    if isinstance(raw_companies, str):
        companies_list = parse_json_list(raw_companies)
    else:
        companies_list = list(raw_companies)
    big_studio = compute_big_studio(companies_list, context.top_companies)

    # 6. Language
    lang = str(movie_input.get("original_language", "en")).lower()
    is_english = 1 if lang == "en" else 0

    # 7. Franchise
    # In single-movie mode, the user's franchise toggle represents whether this film is a
    # "sequel or later instalment of an existing franchise" (1 if sequel/later instalment; 0 for original/first instalment).
    franchise = int(movie_input.get("franchise", 0))

    # 8. Cast & Director
    raw_cast = movie_input.get("cast", [])
    if isinstance(raw_cast, str):
        cast_list = parse_json_list(raw_cast)[:3]
    else:
        cast_list = list(raw_cast)[:3]

    director = movie_input.get("director")
    if isinstance(director, dict):
        director = director.get("name")

    # Star power computation from historical database strictly earlier than release_date
    star_feats = compute_star_power(
        cast_list=cast_list,
        director=director,
        release_date=release_date,
        history=context.history,
        global_prior=context.global_prior,
    )

    # 9. Tiers
    budget_tier = compute_tertile_bin(
        budget, context.tertile_cutoffs["budget"], ["Low", "Medium", "High"]
    )
    star_tier = compute_tertile_bin(
        star_feats["cast_avg_past_revenue"], context.tertile_cutoffs["star"], ["LowStar", "MidStar", "HighStar"]
    )
    dir_tier = compute_tertile_bin(
        star_feats["dir_avg_past_revenue"], context.tertile_cutoffs["director"], ["LowDir", "MidDir", "HighDir"]
    )

    features: Dict[str, Any] = {
        "title": movie_input.get("title", "Untitled"),
        "release_date": release_date,
        "release_year": release_year,
        "release_month": release_month,
        "budget": budget,
        "log_budget": log_budget,
        "runtime": runtime,
        "runtime_bin": runtime_bin,
        "n_genres": n_genres,
        "primary_genre": primary_genre,
        "is_english": is_english,
        "big_studio": big_studio,
        "franchise": franchise,
        "season": season,
        "holiday_flag": holiday_flag,
        "cast_avg_past_revenue": star_feats["cast_avg_past_revenue"],
        "cast_past_hit_rate": star_feats["cast_past_hit_rate"],
        "cast_past_films": star_feats["cast_past_films"],
        "dir_avg_past_revenue": star_feats["dir_avg_past_revenue"],
        "dir_past_hit_rate": star_feats["dir_past_hit_rate"],
        "dir_past_films": star_feats["dir_past_films"],
        "director": director,
        "budget_tier": budget_tier,
        "star_tier": star_tier,
        "director_tier": dir_tier,
    }

    # Add genre 0/1 flags
    features.update(genre_flags)

    # Post-release reception features (if provided for Model B)
    if "vote_average" in movie_input and movie_input["vote_average"] is not None:
        vote_avg = float(movie_input["vote_average"])
        vote_cnt = int(movie_input.get("vote_count", 0))
        pop = float(movie_input.get("popularity", 0.0))
        features["vote_average"] = vote_avg
        features["vote_count"] = vote_cnt
        features["popularity"] = pop
        features["hype_level"] = compute_tertile_bin(
            vote_cnt, context.tertile_cutoffs["hype"], ["LowHype", "MidHype", "HighHype"]
        )
        features["rating_band"] = compute_rating_band(vote_avg)

    return features
