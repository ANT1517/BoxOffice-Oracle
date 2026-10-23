"""
backend/app/routers/health.py - Health check and system operational status endpoint.
"""
from fastapi import APIRouter
from backend.app.services.loader import get_store

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/health")
def health_check():
    """Returns system status, active models, loaded dataset rows, and artifact timestamps."""
    store = get_store()
    return {
        "status": "ok",
        "app": "BoxOffice Oracle",
        "version": "1.0.0",
        "models_loaded": {
            "model_A": store.model_a is not None,
            "model_B": store.model_b is not None,
        },
        "dataset_rows": len(store.movies_df),
        "total_people_indexed": len(store.people_lookup),
        "total_movies_indexed": len(store.movies_search),
    }
