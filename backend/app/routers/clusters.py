"""
backend/app/routers/clusters.py - Cluster analysis profiles, elbow curves, and dendrogram metadata.
"""
from fastapi import APIRouter
from backend.app.services.loader import get_store

router = APIRouter(prefix="/api/clusters", tags=["Cluster Analysis"])


@router.get("")
def get_clusters():
    """Returns K-Means market segment profiles, SSE elbow curve, silhouette scores, and Hierarchical clustering linkage."""
    store = get_store()
    return {
        "kmeans": store.clusters_kmeans,
        "hierarchical": store.clusters_hierarchical,
    }
