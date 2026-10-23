"""
backend/app/routers/predict.py - Inference and what-if simulation endpoints.
"""
from fastapi import APIRouter
from backend.app.schemas.movie import (
    MovieInput,
    PredictResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from backend.app.services.predictor import predict_movie
from backend.app.services.whatif_service import simulate_whatif

router = APIRouter(prefix="/api", tags=["Prediction & What-If"])


@router.post("/predict", response_model=PredictResponse)
def predict_endpoint(movie: MovieInput):
    """
    Predicts commercial Hit/Flop outcome and calibrated probability for a movie.
    Uses Model A for pre-release features or Model B if post-release reception fields are provided.
    Returns local feature explanations (per-prediction permutation deltas) and derived metadata.
    """
    return predict_movie(movie)


@router.post("/whatif", response_model=WhatIfResponse)
def whatif_endpoint(req: WhatIfRequest):
    """
    Executes real-time counterfactual what-if analysis varying a single input attribute
    across candidate values and observing the marginal change in Hit probability.
    """
    return simulate_whatif(req)
