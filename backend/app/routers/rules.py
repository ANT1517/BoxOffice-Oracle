"""
backend/app/routers/rules.py - Class Association Rules query and benchmark router.
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from backend.app.services.loader import get_store

router = APIRouter(prefix="/api/rules", tags=["Association Rules"])


@router.get("")
def get_rules(
    consequent: Optional[str] = Query(None, description="Filter by consequent: 'Hit' or 'Flop'"),
    prerelease_only: bool = Query(False, description="Filter to rules containing strictly pre-release attributes"),
    min_lift: float = Query(0.0, ge=0.0, description="Minimum lift threshold"),
    sort: str = Query("lift", description="Sort field: 'lift', 'confidence', or 'support'"),
    limit: int = Query(50, ge=1, le=200, description="Maximum rules to return"),
):
    """
    Returns mined Class Association Rules (CARs) with support, confidence, and lift metrics.
    Supports filtering by outcome label, pre-release isolation, and multi-metric sorting.
    """
    store = get_store()
    rules_pool: List[Dict[str, Any]] = (
        store.rules.get("prerelease_rules", []) if prerelease_only else store.rules.get("all_rules", [])
    )

    filtered = []
    for r in rules_pool:
        if min_lift > 0 and r.get("lift", 0.0) < min_lift:
            continue
        if consequent:
            c_clean = consequent.strip().lower()
            r_cons = r.get("consequent", "").lower()
            if c_clean == "hit" and "hit" not in r_cons:
                continue
            if c_clean == "flop" and "flop" not in r_cons:
                continue
        filtered.append(r)

    # Sort rules
    sort_key = sort.lower()
    if sort_key not in ("lift", "confidence", "support"):
        sort_key = "lift"
    filtered.sort(key=lambda x: x.get(sort_key, 0.0), reverse=True)

    return {
        "total_matched": len(filtered),
        "limit": limit,
        "prerelease_only": prerelease_only,
        "consequent_filter": consequent,
        "rules": filtered[:limit],
        "benchmark": store.rules_benchmark,
        "summary": {
            "total_rules": store.rules.get("total_rules", 0),
            "hit_rules_count": store.rules.get("hit_rules_count", 0),
            "flop_rules_count": store.rules.get("flop_rules_count", 0),
            "prerelease_rules_count": store.rules.get("prerelease_rules_count", 0),
        },
    }
