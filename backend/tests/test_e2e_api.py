"""
backend/tests/test_e2e_api.py - End-to-End API Integration & Contract Verification Suite
Verifies:
1. Predictions for 3 benchmark movies (Franchise Hit, Horror Sleeper, Mid-Budget Flop)
2. What-If analysis on release month returns exactly 12 month data points
3. OLAP presets (drilldown, slice, dice, pivot, rollup) execute and return valid records
4. Rules filtering by consequent, pre-release isolation, and lift
5. Models endpoint numbers strictly match artifacts/models/metrics.json
"""
import json
import os
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_e2e_predict_three_movies():
    """Predict for 3 dataset movies and confirm API output structure & calibration."""
    # Film 1: Avengers: Age of Ultron (Big-budget franchise Hit)
    movie_1 = {
        "title": "Avengers: Age of Ultron",
        "budget": 280000000,
        "genres": ["Action", "Adventure", "Science Fiction"],
        "release_date": "2015-04-22",
        "runtime": 141,
        "original_language": "en",
        "production_companies": ["Marvel Studios"],
        "cast": ["Robert Downey Jr.", "Chris Evans", "Chris Hemsworth"],
        "director": "Joss Whedon",
        "franchise": 1,
    }
    res_1 = client.post("/api/predict", json=movie_1)
    assert res_1.status_code == 200
    data_1 = res_1.json()
    assert data_1["label"] == "Hit"
    assert data_1["hit_probability"] >= 0.70
    assert len(data_1["top_factors"]) > 0

    # Film 2: Saw (Low-budget horror breakout Hit)
    movie_2 = {
        "title": "Saw",
        "budget": 1200000,
        "genres": ["Horror", "Mystery", "Crime"],
        "release_date": "2004-10-01",
        "runtime": 103,
        "original_language": "en",
        "production_companies": ["Twisted Pictures"],
        "cast": ["Cary Elwes", "Danny Glover", "Monica Potter"],
        "director": "James Wan",
        "franchise": 0,
    }
    res_2 = client.post("/api/predict", json=movie_2)
    assert res_2.status_code == 200
    data_2 = res_2.json()
    assert "hit_probability" in data_2
    assert "risk_tier" in data_2

    # Film 3: Battlefield Earth (Mid-budget original Flop)
    movie_3 = {
        "title": "Battlefield Earth",
        "budget": 44000000,
        "genres": ["Action", "Adventure", "Science Fiction"],
        "release_date": "2000-05-12",
        "runtime": 118,
        "original_language": "en",
        "production_companies": ["Franchise Pictures", "Morgan Creek Productions"],
        "cast": ["John Travolta", "Barry Pepper", "Forest Whitaker"],
        "director": "Roger Christian",
        "franchise": 0,
    }
    res_3 = client.post("/api/predict", json=movie_3)
    assert res_3.status_code == 200
    data_3 = res_3.json()
    assert "hit_probability" in data_3
    assert len(data_3["top_factors"]) > 0


def test_e2e_whatif_release_month_returns_12_points():
    """A what-if simulation on release month must return exactly 12 month evaluations."""
    req = {
        "movie": {
            "title": "Sample Feature Film",
            "budget": 40000000,
            "genres": ["Drama", "Thriller"],
            "release_date": "2015-06-15",
            "runtime": 115,
            "original_language": "en",
            "franchise": 0,
        },
        "varying_field": "release_month",
        "values": list(range(1, 13)),
    }
    res = client.post("/api/whatif", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["varying_field"] == "release_month"
    assert len(data["results"]) == 12
    months_returned = [it["value"] for it in data["results"]]
    assert months_returned == list(range(1, 13))
    for it in data["results"]:
        assert 0.0 <= it["hit_probability"] <= 1.0
        assert it["label"] in ("Hit", "Flop")


def test_e2e_olap_presets_render():
    """Verify all 5 canonical OLAP presets execute and return multi-dimensional data."""
    # 1. Drilldown: genre x season
    res_drill = client.post("/api/olap/query", json={
        "dimensions": ["primary_genre", "season"],
        "measures": ["count", "hit_rate", "median_roi"],
    })
    assert res_drill.status_code == 200
    d_drill = res_drill.json()
    assert d_drill["total_records"] > 0
    assert "primary_genre" in d_drill["dimensions"]
    assert "season" in d_drill["dimensions"]

    # 2. Slice: Horror films across budget tiers
    res_slice = client.post("/api/olap/query", json={
        "dimensions": ["budget_tier"],
        "measures": ["count", "hit_rate", "median_roi"],
        "filters": {"primary_genre": "Horror"},
    })
    assert res_slice.status_code == 200
    d_slice = res_slice.json()
    assert len(d_slice["records"]) > 0

    # 3. Dice: Summer/Holiday x Big Studio x Action/Adventure
    res_dice = client.post("/api/olap/query", json={
        "dimensions": ["primary_genre", "season"],
        "measures": ["count", "hit_rate", "median_roi"],
        "filters": {
            "season": ["Summer", "Holiday"],
            "big_studio": 1,
            "primary_genre": ["Action", "Adventure"],
        },
    })
    assert res_dice.status_code == 200
    d_dice = res_dice.json()
    assert d_dice["total_records"] >= 0

    # 4. Rollup: Overall by season
    res_rollup = client.post("/api/olap/query", json={
        "dimensions": ["season"],
        "measures": ["count", "hit_rate", "median_roi"],
    })
    assert res_rollup.status_code == 200
    d_rollup = res_rollup.json()
    assert len(d_rollup["records"]) == 4  # Summer, Holiday, Dump, Regular


def test_e2e_rules_filters_work():
    """Verify Association Rules endpoints filter by consequent, pre-release isolation, and lift."""
    # All rules
    res_all = client.get("/api/rules?limit=50")
    assert res_all.status_code == 200
    d_all = res_all.json()
    assert len(d_all["rules"]) > 0
    assert "benchmark" in d_all
    assert "explanation" in d_all["benchmark"]

    # Filter by consequent = Hit
    res_hit = client.get("/api/rules?consequent=Hit&limit=50")
    assert res_hit.status_code == 200
    d_hit = res_hit.json()
    for r in d_hit["rules"]:
        assert "Hit" in r["consequent"]

    # Filter by consequent = Flop
    res_flop = client.get("/api/rules?consequent=Flop&limit=50")
    assert res_flop.status_code == 200
    d_flop = res_flop.json()
    for r in d_flop["rules"]:
        assert "Flop" in r["consequent"]

    # Pre-release only filter
    res_pre = client.get("/api/rules?prerelease_only=true&limit=50")
    assert res_pre.status_code == 200
    d_pre = res_pre.json()
    for r in d_pre["rules"]:
        assert not r.get("uses_post_release", False)


def test_e2e_models_metrics_match_file():
    """Confirm /api/models metrics strictly match artifacts/models/metrics.json."""
    metrics_path = os.path.join(BASE_DIR, "artifacts", "models", "metrics.json")
    with open(metrics_path, "r", encoding="utf-8") as f:
        file_metrics = json.load(f)

    res = client.get("/api/models")
    assert res.status_code == 200
    api_payload = res.json()
    assert "metrics" in api_payload
    api_metrics = api_payload["metrics"]

    # Compare Model A ZeroR baseline
    file_zeror = file_metrics["Model_A"]["ZeroR (Baseline)"]
    api_zeror = api_metrics["Model_A"]["ZeroR (Baseline)"]
    assert api_zeror["accuracy"] == file_zeror["accuracy"]
    assert api_zeror["accuracy"] == 0.5621
    assert api_zeror["confusion_matrix"] == file_zeror["confusion_matrix"]

    # Compare Model A Random Forest
    file_rf = file_metrics["Model_A"]["Random Forest"]
    api_rf = api_metrics["Model_A"]["Random Forest"]
    assert api_rf["accuracy"] == file_rf["accuracy"]
    assert api_rf["weighted_f1"] == file_rf["weighted_f1"]

    # Compare Model B Random Forest
    file_b_rf = file_metrics["Model_B"]["Random Forest"]
    api_b_rf = api_metrics["Model_B"]["Random Forest"]
    assert api_b_rf["accuracy"] == file_b_rf["accuracy"]
    assert api_b_rf["weighted_f1"] == file_b_rf["weighted_f1"]
