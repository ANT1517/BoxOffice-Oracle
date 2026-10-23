"""
backend/tests/test_api.py - Comprehensive test suite for BoxOffice Oracle FastAPI endpoints.
Tests schema validation, model prediction parity, what-if simulations, OLAP dimension rejection,
people/movie search, and mining artifact delivery.
"""
import joblib
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.loader import get_store
from ml.features import MODEL_A_PREDICTORS, build_single_movie_features

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint returns ok and confirms all models and data are loaded."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["models_loaded"]["model_A"] is True
    assert data["models_loaded"]["model_B"] is True
    assert data["dataset_rows"] == 3204
    assert data["total_people_indexed"] == 4934
    assert data["total_movies_indexed"] == 3204


def test_meta_endpoint():
    """Verify metadata endpoint returns domain vocabularies, cutoffs, and constants."""
    res = client.get("/api/meta")
    assert res.status_code == 200
    data = res.json()
    assert data["hit_threshold_roi"] == 2.0
    assert "genres" in data
    assert "studios" in data
    assert "season_definitions" in data
    assert "budget_tier_cutoffs" in data


def test_schema_validation_rejects_invalid_inputs():
    """Verify Pydantic schema validation returns 422 for malformed movie inputs."""
    # Negative budget
    res1 = client.post("/api/predict", json={
        "title": "Bad Budget",
        "budget": -5000000,
        "genres": ["Action"],
        "release_date": "2026-05-15",
        "runtime": 120,
    })
    assert res1.status_code == 422

    # Zero runtime
    res2 = client.post("/api/predict", json={
        "title": "Zero Runtime",
        "budget": 5000000,
        "genres": ["Action"],
        "release_date": "2026-05-15",
        "runtime": 0,
    })
    assert res2.status_code == 422

    # Empty genres list
    res3 = client.post("/api/predict", json={
        "title": "No Genres",
        "budget": 5000000,
        "genres": [],
        "release_date": "2026-05-15",
        "runtime": 100,
    })
    assert res3.status_code == 422

    # Malformed release date
    res4 = client.post("/api/predict", json={
        "title": "Bad Date",
        "budget": 5000000,
        "genres": ["Drama"],
        "release_date": "invalid-date",
        "runtime": 100,
    })
    assert res4.status_code == 422

    # More than 3 cast members
    res5 = client.post("/api/predict", json={
        "title": "Too Many Cast",
        "budget": 5000000,
        "genres": ["Drama"],
        "release_date": "2026-05-15",
        "runtime": 100,
        "cast": ["Actor 1", "Actor 2", "Actor 3", "Actor 4"],
    })
    assert res5.status_code == 422


def test_predict_real_dataset_movie_parity():
    """
    Verify /api/predict returns the exact same calibrated probability as calling
    the serialized model directly on features computed via ml/features.py.
    """
    store = get_store()
    movie_record = store.movies_search[0]  # First movie in dataset
    movie_input = movie_record["movie_input"]

    # Call API without reception fields to test Model A
    input_a = dict(movie_input)
    input_a["vote_average"] = None
    input_a["vote_count"] = None
    input_a["popularity"] = None

    api_res = client.post("/api/predict", json=input_a)
    assert api_res.status_code == 200
    api_data = api_res.json()
    assert api_data["model_used"] == "Model_A"

    # Direct model calculation
    derived_feats = build_single_movie_features(input_a, store.feature_context)
    row_df = pd.DataFrame([derived_feats])
    direct_prob = float(store.model_a.predict_proba(row_df[MODEL_A_PREDICTORS])[:, 1][0])

    assert api_data["out_of_fold_probability"] is not None
    assert abs(api_data["hit_probability"] - api_data["out_of_fold_probability"]) < 1e-4
    assert abs(api_data["in_sample_probability"] - direct_prob) < 1e-4
    assert len(api_data["top_factors"]) <= 5
    assert "risk_tier" in api_data
    assert any("fair estimate" in w for w in api_data["warnings"])

    # Test fresh / non-dataset movie where headline hit_probability matches in-sample direct model calculation
    fresh_movie = {
        "title": "Fresh Original Sci-Fi",
        "budget": 50000000,
        "genres": ["Science Fiction"],
        "release_date": "2027-06-15",
        "runtime": 115,
        "original_language": "en",
        "director": "Unknown Director",
        "cast": ["Actor A", "Actor B"],
        "franchise": 0,
    }
    fresh_res = client.post("/api/predict", json=fresh_movie)
    assert fresh_res.status_code == 200
    fresh_data = fresh_res.json()
    assert fresh_data["out_of_fold_probability"] is None
    fresh_derived = build_single_movie_features(fresh_movie, store.feature_context)
    fresh_direct = float(store.model_a.predict_proba(pd.DataFrame([fresh_derived])[MODEL_A_PREDICTORS])[:, 1][0])
    assert abs(fresh_data["hit_probability"] - fresh_direct) < 1e-4


def test_whatif_one_result_per_requested_value():
    """Verify /api/whatif returns exactly one evaluated result per candidate value."""
    base_movie = {
        "title": "Inception What-If",
        "budget": 160000000,
        "genres": ["Action", "Science Fiction"],
        "release_date": "2026-07-16",
        "runtime": 148,
        "original_language": "en",
        "director": "Christopher Nolan",
        "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
        "franchise": 0,
    }
    candidate_budgets = [30000000, 80000000, 160000000, 250000000]

    req_body = {
        "movie": base_movie,
        "varying_field": "budget",
        "values": candidate_budgets,
    }
    res = client.post("/api/whatif", json=req_body)
    assert res.status_code == 200
    data = res.json()
    assert data["varying_field"] == "budget"
    assert len(data["results"]) == len(candidate_budgets)

    for i, item in enumerate(data["results"]):
        assert item["value"] == candidate_budgets[i]
        assert 0.0 <= item["hit_probability"] <= 1.0
        assert item["label"] in ("Hit", "Flop")


def test_olap_query_rejects_unknown_dimensions():
    """Verify /api/olap/query rejects unknown dimensions with HTTP 422."""
    res_bad = client.post("/api/olap/query", json={
        "dimensions": ["unknown_dimension_xyz"],
        "measures": ["count", "hit_rate"],
    })
    assert res_bad.status_code == 422
    assert "Unknown OLAP dimension" in res_bad.json()["detail"]

    # Valid OLAP query succeeds
    res_good = client.post("/api/olap/query", json={
        "dimensions": ["primary_genre", "season"],
        "measures": ["count", "hit_rate", "median_roi"],
    })
    assert res_good.status_code == 200
    data = res_good.json()
    assert len(data["records"]) > 0
    assert "primary_genre" in data["records"][0]
    assert "season" in data["records"][0]


def test_people_search_returns_sensible_matches():
    """Verify /api/people/search returns relevant actors and directors with track records."""
    res_dir = client.get("/api/people/search?q=Cameron&role=director")
    assert res_dir.status_code == 200
    dir_matches = res_dir.json()
    assert len(dir_matches) > 0
    names = [d["name"] for d in dir_matches]
    assert "James Cameron" in names

    cameron_obj = next(d for d in dir_matches if d["name"] == "James Cameron")
    assert "director" in cameron_obj["roles"]
    assert cameron_obj["film_count"] >= 1
    assert cameron_obj["past_hit_rate"] >= 0.5


def test_movies_search():
    """Verify /api/movies/search finds dataset movies and returns pre-populated inputs."""
    res = client.get("/api/movies/search?q=Avatar&limit=5")
    assert res.status_code == 200
    movies = res.json()
    assert len(movies) > 0
    titles = [m["title"] for m in movies]
    assert "Avatar" in titles

    avatar = next(m for m in movies if m["title"] == "Avatar")
    assert avatar["label"] == "Hit"
    assert avatar["budget"] == 237000000.0
    assert "movie_input" in avatar


def test_rules_endpoint():
    """Verify /api/rules returns CARs with lift, support, confidence, and benchmark info."""
    res = client.get("/api/rules?consequent=Hit&prerelease_only=true&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["prerelease_only"] is True
    assert len(data["rules"]) <= 10
    for r in data["rules"]:
        assert r["is_hit_rule"] is True
        assert r["uses_post_release"] is False
        assert r["lift"] >= 1.0


def test_clusters_endpoint():
    """Verify /api/clusters returns K-Means and Hierarchical clustering profiles."""
    res = client.get("/api/clusters")
    assert res.status_code == 200
    data = res.json()
    assert "kmeans" in data
    assert "hierarchical" in data
    assert "clusters" in data["kmeans"]


def test_models_endpoint():
    """Verify /api/models returns complete cross-validation metrics, tests, and tree JSON."""
    res = client.get("/api/models")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "significance" in data
    assert "importance" in data
    assert "model_card" in data
    assert "decision_tree_A" in data
    assert data["decision_tree_A"]["is_leaf"] is False
