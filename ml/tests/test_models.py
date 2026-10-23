"""
ml/tests/test_models.py - Unit tests for Phase 4 supervised learning models and explanation engine.
"""
import json
import os
import joblib
import pandas as pd
import pytest

from ml.features import MODEL_A_PREDICTORS, MODEL_B_PREDICTORS
from ml.models import explain


def test_models_exist_and_loadable():
    assert os.path.exists("artifacts/models/model_A.joblib")
    assert os.path.exists("artifacts/models/model_B.joblib")
    assert os.path.exists("artifacts/models/model_card.json")
    assert os.path.exists("artifacts/models/tree_model_A.json")

    model_a = joblib.load("artifacts/models/model_A.joblib")
    model_b = joblib.load("artifacts/models/model_B.joblib")

    assert hasattr(model_a, "predict_proba")
    assert hasattr(model_b, "predict_proba")


def test_model_predictions_on_real_data():
    df = pd.read_parquet("artifacts/data/movies_clean.parquet")
    sample_a = df[MODEL_A_PREDICTORS].iloc[:5]
    sample_b = df[MODEL_B_PREDICTORS].iloc[:5]

    model_a = joblib.load("artifacts/models/model_A.joblib")
    model_b = joblib.load("artifacts/models/model_B.joblib")

    probs_a = model_a.predict_proba(sample_a)[:, 1]
    probs_b = model_b.predict_proba(sample_b)[:, 1]

    assert len(probs_a) == 5
    assert len(probs_b) == 5
    assert all(0.0 <= p <= 1.0 for p in probs_a)
    assert all(0.0 <= p <= 1.0 for p in probs_b)


def test_explanation_engine():
    df = pd.read_parquet("artifacts/data/movies_clean.parquet")
    sample_film = df.iloc[0].to_dict()

    res = explain(sample_film, model_path="artifacts/models/model_A.joblib", model_type="A")
    assert "predicted_hit_probability" in res
    assert res["prediction"] in ["Hit", "Flop"]
    assert "top_contributions" in res
    assert len(res["top_contributions"]) <= 5
    for c in res["top_contributions"]:
        assert "feature" in c
        assert "delta_probability" in c
        assert c["impact"] in ["positive", "negative"]


def test_tree_json_validity():
    with open("artifacts/models/tree_model_A.json", "r", encoding="utf-8") as f:
        tree_dict = json.load(f)

    assert "node_id" in tree_dict
    assert "is_leaf" in tree_dict
    assert "hit_probability" in tree_dict
