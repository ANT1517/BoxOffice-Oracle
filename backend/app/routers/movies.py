"""
backend/app/routers/movies.py - Movie search and retrieval router for scenario loading.
"""
from typing import List
from fastapi import APIRouter, Query
from backend.app.schemas.movie import MovieSearchItem
from backend.app.services.search_service import search_movies

router = APIRouter(prefix="/api/movies", tags=["Movie Search"])


@router.get("/search", response_model=List[MovieSearchItem])
def search_movies_endpoint(
    q: str = Query("", description="Movie title search string (empty returns top popular films)"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of movies to return"),
):
    """Search dataset films by title to pre-populate what-if scenarios with real-world baselines."""
    return search_movies(q=q, limit=limit)
