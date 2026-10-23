"""
ml/tests/test_feature_parity.py - Parity test verifying single-movie and batch-mode feature parity.
Tests 20 randomly sampled films from the cleaned dataset.
"""
import ast
import json
import joblib
import numpy as np
import pandas as pd
import pytest
from ml.clean import parse_json_list
from ml.features import (
    MODEL_A_PREDICTORS,
    MODEL_B_PREDICTORS,
    build_single_movie_features,
)


@pytest.fixture(scope="module")
def context():
    ctx = joblib.load("artifacts/lookups/feature_context.joblib")
    return ctx


@pytest.fixture(scope="module")
def clean_df():
    df = pd.read_parquet("artifacts/data/movies_clean.parquet")
    return df


@pytest.fixture(scope="module")
def raw_data():
    movies = pd.read_csv("data/tmdb_5000_movies.csv")
    credits = pd.read_csv("data/tmdb_5000_credits.csv")
    credits = credits.rename(columns={"movie_id": "id"}).drop(columns=["title"], errors="ignore")
    df = movies.merge(credits, on="id", how="left")
    return df.set_index("id")


def test_feature_parity_20_random_films(clean_df, raw_data, context):
    """
    Test 20 random films from the cleaned dataset to prove that building features
    in single-movie mode yields the identical features as batch training mode.
    """
    # Sample 20 random films with fixed seed for reproducibility
    sample_df = clean_df.sample(n=20, random_state=42)
    print(f"\n--- Testing Feature Parity on {len(sample_df)} Random Films ---")

    tested_count = 0
    for _, row in sample_df.iterrows():
        movie_id = row["id"]
        raw_row = raw_data.loc[movie_id]

        raw_cast_list = parse_json_list(raw_row["cast"])[:3]
        raw_companies_list = parse_json_list(raw_row["production_companies"])
        raw_genres_list = parse_json_list(raw_row["genres"])

        single_feats = build_single_movie_features(
            {
                "title": row["title"],
                "budget": float(raw_row["budget"]),
                "genres": raw_genres_list,
                "release_date": row["release_date"],
                "runtime": float(raw_row["runtime"]),
                "original_language": str(raw_row["original_language"]),
                "production_companies": raw_companies_list,
                "cast": raw_cast_list,
                "director": row["director"] if pd.notna(row["director"]) else None,
                "franchise": int(row["franchise"]),
                "vote_average": float(raw_row["vote_average"]),
                "vote_count": int(raw_row["vote_count"]),
                "popularity": float(raw_row["popularity"]),
            },
            context,
        )

        # 1. Assert Model A predictors match batch mode
        assert np.isclose(single_feats["log_budget"], row["log_budget"], atol=1e-5), (
            f"log_budget mismatch for {row['title']}"
        )
        assert np.isclose(single_feats["runtime"], row["runtime"], atol=1e-5)
        assert single_feats["n_genres"] == row["n_genres"]
        assert single_feats["primary_genre"] == row["primary_genre"]
        assert single_feats["is_english"] == row["is_english"]
        assert single_feats["big_studio"] == row["big_studio"]
        assert single_feats["franchise"] == row["franchise"]
        assert single_feats["release_month"] == row["release_month"]
        assert single_feats["release_year"] == row["release_year"]
        assert single_feats["season"] == row["season"]
        assert single_feats["holiday_flag"] == row["holiday_flag"]

        # Star power assertions (Cast & Director)
        assert np.isclose(single_feats["cast_avg_past_revenue"], row["cast_avg_past_revenue"], atol=1e-3), (
            f"cast_avg_past_revenue mismatch for {row['title']}: {single_feats['cast_avg_past_revenue']} vs {row['cast_avg_past_revenue']}"
        )
        assert np.isclose(single_feats["cast_past_hit_rate"], row["cast_past_hit_rate"], atol=1e-3), (
            f"cast_past_hit_rate mismatch for {row['title']}: {single_feats['cast_past_hit_rate']} vs {row['cast_past_hit_rate']}"
        )
        assert single_feats["cast_past_films"] == row["cast_past_films"], (
            f"cast_past_films mismatch for {row['title']}"
        )

        assert np.isclose(single_feats["dir_avg_past_revenue"], row["dir_avg_past_revenue"], atol=1e-3), (
            f"dir_avg_past_revenue mismatch for {row['title']}"
        )
        assert np.isclose(single_feats["dir_past_hit_rate"], row["dir_past_hit_rate"], atol=1e-3)
        assert single_feats["dir_past_films"] == row["dir_past_films"]

        # 2. Assert Model B predictors match batch mode
        assert np.isclose(single_feats["vote_average"], row["vote_average"], atol=1e-5)
        assert single_feats["vote_count"] == row["vote_count"]
        assert np.isclose(single_feats["popularity"], row["popularity"], atol=1e-5)
        assert single_feats["rating_band"] == row["rating_band"]
        assert single_feats["runtime_bin"] == row["runtime_bin"]

        tested_count += 1
        print(
            f"  [PASS] Film #{tested_count:02d}: '{row['title']}' ({row['release_year']}) | "
            f"cast_past_films={single_feats['cast_past_films']}, dir_past_films={single_feats['dir_past_films']}"
        )

    assert tested_count == 20
    print(f"\nAll {tested_count} random films passed 100% parity assertion across all features!")
