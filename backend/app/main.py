"""
backend/app/main.py - BoxOffice Oracle FastAPI Application Entry Point.
Serves trained ML models and descriptive data mining artifacts with strict validation.
"""
from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers import (
    clusters,
    health,
    insights,
    meta,
    models,
    movies,
    olap,
    people,
    predict,
    rules,
)
from backend.app.services.loader import get_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: pre-loads all models and mining artifacts on startup."""
    print("=== [Startup] Loading BoxOffice Oracle Models and Artifacts ===")
    store = get_store()
    print(f"  [OK] Model A & Model B loaded into memory")
    print(f"  [OK] FeatureContext loaded ({len(store.feature_context.top_companies)} studios, prior={store.feature_context.global_prior:.4f})")
    print(f"  [OK] {len(store.people_lookup)} people indexed for fuzzy lookup")
    print(f"  [OK] {len(store.movies_search)} clean dataset movies indexed for search")
    print(f"  [OK] EDA, OLAP presets, Association Rules, and Cluster profiles loaded")
    yield
    print("=== [Shutdown] Releasing BoxOffice Oracle Resources ===")


app = FastAPI(
    title="BoxOffice Oracle API",
    description="Full-stack Data Mining and Box-Office Commercial Prediction Engine (VNRVJIET IT CBP 2026-27).",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration (Restricted strictly to the Vite development server origin from .env)
frontend_port = os.getenv("FRONTEND_PORT", "5173")
origins = [
    f"http://localhost:{frontend_port}",
    f"http://127.0.0.1:{frontend_port}",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All Subsystem Routers
app.include_router(health.router)
app.include_router(meta.router)
app.include_router(people.router)
app.include_router(predict.router)
app.include_router(movies.router)
app.include_router(insights.router)
app.include_router(olap.router)
app.include_router(rules.router)
app.include_router(clusters.router)
app.include_router(models.router)
