"""
backend/app/schemas/people.py - Pydantic schemas for RapidFuzz people autocomplete lookup.
"""
from typing import List, Optional
from pydantic import BaseModel


class PersonSearchItem(BaseModel):
    name: str
    roles: List[str]  # ["actor"], ["director"], or ["actor", "director"]
    film_count: int
    last_film_year: Optional[int]
    avg_past_revenue: float
    past_hit_rate: float
