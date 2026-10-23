"""
backend/app/routers/models.py - Model benchmark metrics, significance tests, feature importances, and tree graph.
"""
from fastapi import APIRouter
from backend.app.services.loader import get_store

router = APIRouter(prefix="/api/models", tags=["Model Benchmark"])


@router.get("")
def get_model_benchmarks():
    """Returns 10-fold CV metrics across 6 algorithms, Nadeau-Bengio significance tests, feature importances, model card, and decision tree JSON."""
    store = get_store()
    return {
        "metrics": store.models_metrics,
        "significance": store.models_significance,
        "importance": store.models_importance,
        "model_card": store.models_card,
        "decision_tree_A": store.tree_model_a,
    }
