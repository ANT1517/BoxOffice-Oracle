"""
backend/app/routers/insights.py - Exploratory data analysis insights router.
"""
from fastapi import APIRouter
from backend.app.services.loader import get_store

router = APIRouter(prefix="/api/insights", tags=["Insights & EDA"])


@router.get("/eda")
def get_eda_insights():
    """Returns the comprehensive Exploratory Data Analysis suite (distributions, scatter data, hit rates)."""
    store = get_store()
    return store.eda
