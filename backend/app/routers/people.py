"""
backend/app/routers/people.py - Fast autocomplete search for actors and directors.
"""
from typing import List, Optional
from fastapi import APIRouter, Query
from backend.app.schemas.people import PersonSearchItem
from backend.app.services.search_service import search_people

router = APIRouter(prefix="/api/people", tags=["People Search"])


@router.get("/search", response_model=List[PersonSearchItem])
def search_people_endpoint(
    q: str = Query(..., min_length=1, description="Person name query string"),
    role: Optional[str] = Query(None, description="Optional role filter: 'actor'/'cast' or 'director'"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of matches to return"),
):
    """Autocomplete search for actors and directors with historical track record statistics."""
    return search_people(q=q, role=role, limit=limit)
