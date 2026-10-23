"""
backend/app/routers/meta.py - Metadata and vocabulary dictionary endpoint.
"""
from fastapi import APIRouter
from backend.app.services.loader import get_store

router = APIRouter(prefix="/api", tags=["Metadata"])


@router.get("/meta")
def get_metadata():
    """Returns dataset vocabularies, tier cutoffs, season definitions, and baseline thresholds."""
    store = get_store()
    return {
        "hit_threshold_roi": 2.0,
        "class_balance": {
            "Hit": int((store.movies_df["label"] == "Hit").sum()),
            "Flop": int((store.movies_df["label"] == "Flop").sum()),
            "hit_percentage": 56.21,
        },
        "dataset_date_range": {
            "min_date": "1916-09-04",
            "max_date": "2017-02-03",
            "total_films": len(store.movies_df),
        },
        "genres": store.genres_lookup,
        "languages": store.languages_lookup,
        "studios": store.studios_lookup,
        "season_definitions": {
            "Dump": "January & February (post-holiday slow period)",
            "Spring": "March & April (counterprogramming window)",
            "Summer": "May through August (prime blockbuster theatrical corridor)",
            "Regular": "September & October (autumn transition period)",
            "Holiday": "November & December (awards & family holiday corridor)",
        },
        "budget_tier_cutoffs": {
            "Low": f"< ${store.feature_context.tertile_cutoffs['budget'][0]:,.0f}",
            "Medium": f"${store.feature_context.tertile_cutoffs['budget'][0]:,.0f} - ${store.feature_context.tertile_cutoffs['budget'][1]:,.0f}",
            "High": f"> ${store.feature_context.tertile_cutoffs['budget'][1]:,.0f}",
        },
    }
