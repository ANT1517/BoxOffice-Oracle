"""
backend/app/services/predictor.py - Production inference service calling shared ml/features.py builder.
Implements dual Model A (pre-release) and Model B (with reception) prediction and local explanation.
"""
from typing import Any, Dict, List, Tuple
import pandas as pd

from backend.app.schemas.movie import FactorContribution, MovieInput, PredictResponse
from backend.app.services.loader import get_store
from ml.features import (
    MODEL_A_PREDICTORS,
    MODEL_B_PREDICTORS,
    build_single_movie_features,
)
from ml.models import explain


def to_builtin(val: Any) -> Any:
    """Recursively convert NumPy scalars/arrays to standard Python types."""
    import numpy as np
    if isinstance(val, (np.integer, int)):
        return int(val)
    elif isinstance(val, (np.floating, float)):
        return round(float(val), 4)
    elif isinstance(val, np.ndarray):
        return [to_builtin(x) for x in val.tolist()]
    elif isinstance(val, dict):
        return {k: to_builtin(v) for k, v in val.items()}
    elif isinstance(val, (list, tuple)):
        return [to_builtin(x) for x in val]
    return val


def predict_movie(movie: MovieInput) -> PredictResponse:
    """
    Executes box-office prediction for a movie input using either Model A or Model B.
    Enforces strict zero-leakage guarantees and computes local explanation factors.
    """
    store = get_store()
    movie_dict = movie.model_dump()
    warnings: List[str] = []

    # 1. Determine Model Type (Model B requires all 3 post-release reception signals)
    has_reception = (
        movie.vote_average is not None
        and movie.vote_count is not None
        and movie.popularity is not None
    )
    model_type = "B" if has_reception else "A"
    model = store.model_b if model_type == "B" else store.model_a
    features_list = MODEL_B_PREDICTORS if model_type == "B" else MODEL_A_PREDICTORS

    # 2. Honest Predictions for Training Dataset Movies
    out_of_fold_prob = None
    input_id = movie_dict.get("id")
    input_title = (movie.title or "").strip().lower()
    input_date = str(movie.release_date)[:10]

    matched_movie = None
    for m in store.movies_search:
        m_id = m.get("id")
        m_title = (m.get("title") or "").strip().lower()
        m_date = str(m.get("release_date") or "")[:10]

        is_id_match = (input_id is not None and m_id is not None and input_id == m_id)
        is_title_date_match = (bool(input_title) and input_title == m_title and input_date == m_date)

        if is_id_match or is_title_date_match:
            m_budget = float(m.get("budget", 0))
            if abs(float(movie.budget) - m_budget) <= max(1.0, 0.01 * m_budget):
                matched_movie = m
                break

    if matched_movie is not None:
        oof_val = matched_movie.get("oof_hit_probability_B") if model_type == "B" else matched_movie.get("oof_hit_probability_A")
        if oof_val is not None:
            out_of_fold_prob = round(float(oof_val), 4)
            warnings.append("This movie was in the training data; the out-of-fold probability is the fair estimate.")

    # 3. Inspect Newcomer / Date Warnings
    if movie.director:
        dir_info = store.people_lookup.get(movie.director)
        if not dir_info or "director" not in dir_info.get("roles", []):
            warnings.append(
                f"Director '{movie.director}' not found in historical credits: treated as newcomer (past revenue and hit rate defaulted to 0)."
            )

    for cast_name in movie.cast:
        cast_info = store.people_lookup.get(cast_name)
        if not cast_info or "actor" not in cast_info.get("roles", []):
            warnings.append(
                f"Cast member '{cast_name}' not found in historical credits: treated as newcomer."
            )

    if movie.release_date > "2017-12-31":
        warnings.append(
            f"Release date ({movie.release_date}) is after dataset historical cutoff (2017-12-31). Historical star and director track records reflect strictly films released prior to 2018."
        )

    # 3. Build Features using Single-Movie Mode (Strict Parity with Offline Training)
    derived_feats = build_single_movie_features(movie_dict, store.feature_context)

    # 4. Model Inference
    row_df = pd.DataFrame([derived_feats])
    probs = model.predict_proba(row_df[features_list])[0]
    in_sample_hit_prob = float(probs[1])
    in_sample_label = "Hit" if in_sample_hit_prob >= 0.5 else "Flop"
    if in_sample_hit_prob >= 0.70:
        in_sample_risk_tier = "Low Risk (Strong Hit Potential)"
    elif in_sample_hit_prob >= 0.50:
        in_sample_risk_tier = "Moderate Risk (Probable Hit)"
    elif in_sample_hit_prob >= 0.35:
        in_sample_risk_tier = "High Risk (Probable Flop)"
    else:
        in_sample_risk_tier = "Critical Risk (Severe Flop Vulnerability)"

    # If movie is in training data, headline results use honest out_of_fold_probability
    if out_of_fold_prob is not None:
        headline_prob = out_of_fold_prob
        headline_label = "Hit" if headline_prob >= 0.5 else "Flop"
        if headline_prob >= 0.70:
            headline_risk_tier = "Low Risk (Strong Hit Potential)"
        elif headline_prob >= 0.50:
            headline_risk_tier = "Moderate Risk (Probable Hit)"
        elif headline_prob >= 0.35:
            headline_risk_tier = "High Risk (Probable Flop)"
        else:
            headline_risk_tier = "Critical Risk (Severe Flop Vulnerability)"
        confidence = round(abs(headline_prob - 0.5) * 2.0, 4)
    else:
        headline_prob = in_sample_hit_prob
        headline_label = in_sample_label
        headline_risk_tier = in_sample_risk_tier
        confidence = round(abs(headline_prob - 0.5) * 2.0, 4)

    # 5. Local Explanation via Per-Prediction Permutation Deltas
    model_path = (
        "artifacts/models/model_B.joblib" if model_type == "B" else "artifacts/models/model_A.joblib"
    )
    expl = explain(derived_feats, model_path=model_path, model_type=model_type, top_k=5)
    top_factors = [
        FactorContribution(
            feature=str(c["feature"]),
            current_value=to_builtin(c["current_value"]),
            reference_value=to_builtin(c["reference_value"]),
            delta_probability=float(round(c["delta_probability"], 4)),
            impact=str(c["impact"]),
        )
        for c in expl["top_contributions"]
    ]

    # Clean derived feature summary for UI display
    derived_summary = {
        "log_budget": to_builtin(derived_feats.get("log_budget")),
        "budget_tier": to_builtin(derived_feats.get("budget_tier")),
        "runtime": to_builtin(derived_feats.get("runtime")),
        "runtime_bin": to_builtin(derived_feats.get("runtime_bin")),
        "season": to_builtin(derived_feats.get("season")),
        "holiday_flag": to_builtin(derived_feats.get("holiday_flag")),
        "is_english": to_builtin(derived_feats.get("is_english")),
        "big_studio": to_builtin(derived_feats.get("big_studio")),
        "franchise": to_builtin(derived_feats.get("franchise")),
        "primary_genre": to_builtin(derived_feats.get("primary_genre")),
        "n_genres": to_builtin(derived_feats.get("n_genres")),
        "star_tier": to_builtin(derived_feats.get("star_tier")),
        "cast_avg_past_revenue": to_builtin(derived_feats.get("cast_avg_past_revenue")),
        "cast_past_hit_rate": to_builtin(derived_feats.get("cast_past_hit_rate")),
        "cast_past_films": to_builtin(derived_feats.get("cast_past_films")),
        "director_tier": to_builtin(derived_feats.get("director_tier")),
        "dir_avg_past_revenue": to_builtin(derived_feats.get("dir_avg_past_revenue")),
        "dir_past_hit_rate": to_builtin(derived_feats.get("dir_past_hit_rate")),
        "dir_past_films": to_builtin(derived_feats.get("dir_past_films")),
    }
    if model_type == "B":
        derived_summary.update({
            "vote_average": to_builtin(derived_feats.get("vote_average")),
            "vote_count": to_builtin(derived_feats.get("vote_count")),
            "popularity": to_builtin(derived_feats.get("popularity")),
            "hype_level": to_builtin(derived_feats.get("hype_level")),
            "rating_band": to_builtin(derived_feats.get("rating_band")),
        })

    return PredictResponse(
        title=movie.title or "Untitled",
        model_used=f"Model_{model_type}",
        label=headline_label,
        hit_probability=round(headline_prob, 4),
        in_sample_probability=round(in_sample_hit_prob, 4) if out_of_fold_prob is not None else None,
        in_sample_label=in_sample_label if out_of_fold_prob is not None else None,
        in_sample_risk_tier=in_sample_risk_tier if out_of_fold_prob is not None else None,
        out_of_fold_probability=out_of_fold_prob,
        risk_tier=headline_risk_tier,
        confidence_score=confidence,
        top_factors=top_factors,
        derived_features=derived_summary,
        warnings=warnings,
    )
