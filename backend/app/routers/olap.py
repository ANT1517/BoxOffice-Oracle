"""
backend/app/routers/olap.py - Multidimensional OLAP cube queries and canonical preset operations.
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.olap import (
    ALLOWED_DIMENSIONS,
    ALLOWED_MEASURES,
    OlapQueryRequest,
    OlapQueryResponse,
)
from backend.app.services.loader import get_store
from ml.olap import olap_query

router = APIRouter(prefix="/api/olap", tags=["OLAP Cube"])


@router.post("/query", response_model=OlapQueryResponse)
def execute_olap_query(req: OlapQueryRequest):
    """
    Executes a dynamic multidimensional OLAP aggregation query across specified dimensions and measures.
    Validates dimensions and measures against allowed schemas, rejecting invalid dimensions with 422.
    """
    store = get_store()

    # Validate dimensions
    for dim in req.dimensions:
        if dim not in ALLOWED_DIMENSIONS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unknown OLAP dimension '{dim}'. Allowed dimensions are: {sorted(list(ALLOWED_DIMENSIONS))}",
            )

    # Validate measures
    for m in req.measures:
        if m not in ALLOWED_MEASURES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unknown OLAP measure '{m}'. Allowed measures are: {sorted(list(ALLOWED_MEASURES))}",
            )

    # Execute aggregation query
    res = olap_query(
        store.movies_df,
        rows=req.dimensions,
        measures=req.measures,
        filters=req.filters,
    )
    records = res.get("data", [])

    low_conf = sum(1 for r in records if r.get("low_confidence", False))
    small_samp = sum(1 for r in records if r.get("small_sample", False))

    return OlapQueryResponse(
        dimensions=req.dimensions,
        measures=req.measures,
        records=records,
        total_records=len(records),
        low_confidence_count=low_conf,
        small_sample_count=small_samp,
    )


@router.get("/presets")
def get_olap_presets():
    """Returns canonical precomputed OLAP cube operations (rollup, drilldown, slice, dice, pivot)."""
    store = get_store()
    return store.olap_presets
