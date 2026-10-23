"""
backend/app/schemas/olap.py - Pydantic schemas for dynamic OLAP cube queries.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


ALLOWED_DIMENSIONS = {
    "year",
    "decade",
    "release_month",
    "season",
    "primary_genre",
    "budget_tier",
    "runtime_bin",
    "big_studio",
    "franchise",
    "label",
}

ALLOWED_MEASURES = {
    "count",
    "hit_rate",
    "median_roi",
    "avg_roi",
    "total_revenue",
    "median_budget",
}


class OlapQueryRequest(BaseModel):
    dimensions: List[str] = Field(..., min_length=1, description="List of dimensions to group by")
    measures: List[str] = Field(default=["count", "hit_rate", "median_roi"], min_length=1, description="List of measures to aggregate")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Optional slice/dice filters (e.g. {'primary_genre': 'Action'})")


class OlapQueryResponse(BaseModel):
    dimensions: List[str]
    measures: List[str]
    records: List[Dict[str, Any]]
    total_records: int
    low_confidence_count: int
    small_sample_count: int
