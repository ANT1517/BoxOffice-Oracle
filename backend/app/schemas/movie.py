"""
backend/app/schemas/movie.py - Pydantic models for movie prediction, what-if, and search.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class MovieInput(BaseModel):
    id: Optional[int] = Field(None, description="Optional TMDb movie ID for dataset films")
    title: Optional[str] = Field("Untitled", description="Movie title")
    budget: float = Field(..., gt=0, description="Production budget in USD (must be > 0)")
    genres: List[str] = Field(..., min_length=1, description="List of movie genres (at least 1 required)")
    release_date: str = Field(..., description="Release date in YYYY-MM-DD format")
    runtime: float = Field(..., gt=0, description="Movie runtime in minutes (must be > 0)")
    original_language: str = Field("en", description="Two-letter ISO 639-1 language code")
    production_companies: List[str] = Field(default_factory=list, description="Production company names")
    cast: List[str] = Field(default_factory=list, max_length=3, description="Top-3 billed cast members")
    director: str = Field("", description="Director full name")
    franchise: int = Field(0, ge=0, le=1, description="Franchise indicator: 1 if this is a sequel or later instalment of an existing franchise; 0 for an original or first instalment.")
    
    # Optional post-release reception attributes (triggers Model B if all 3 provided)
    vote_average: Optional[float] = Field(None, ge=0.0, le=10.0, description="Audience vote average (0 to 10)")
    vote_count: Optional[int] = Field(None, ge=0, description="Total audience vote count")
    popularity: Optional[float] = Field(None, ge=0.0, description="TMDb popularity score")

    @field_validator("release_date")
    @classmethod
    def validate_release_date(cls, v: str) -> str:
        try:
            dt = datetime.strptime(v.strip()[:10], "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid release_date '{v}'. Must be formatted as YYYY-MM-DD.")
        if dt.year < 1900 or dt.year > 2100:
            raise ValueError(f"Release year {dt.year} is out of realistic range (1900-2100).")
        return dt.strftime("%Y-%m-%d")

    @field_validator("original_language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not cleaned:
            return "en"
        return cleaned


class FactorContribution(BaseModel):
    feature: str
    current_value: Any
    reference_value: Any
    delta_probability: float
    impact: str  # "positive" or "negative"


class PredictResponse(BaseModel):
    title: str
    model_used: str  # "Model_A" or "Model_B"
    label: str  # "Hit" or "Flop"
    hit_probability: float
    in_sample_probability: Optional[float] = Field(None, description="In-sample model probability if out-of-fold is used as headline")
    in_sample_label: Optional[str] = Field(None, description="In-sample model label if out-of-fold is used as headline")
    in_sample_risk_tier: Optional[str] = Field(None, description="In-sample risk tier if out-of-fold is used as headline")
    out_of_fold_probability: Optional[float] = Field(None, description="Honest out-of-fold calibrated Hit probability for training dataset films")
    risk_tier: str  # "Low Risk", "Moderate Risk", "High Risk", "Critical Risk"
    confidence_score: float
    top_factors: List[FactorContribution]
    derived_features: Dict[str, Any]
    warnings: List[str]


class WhatIfRequest(BaseModel):
    movie: MovieInput
    varying_field: str = Field(..., description="Field name to vary, e.g. 'budget', 'release_date', 'director', 'franchise'")
    values: List[Any] = Field(..., min_length=1, description="List of alternative values to evaluate")


class WhatIfItem(BaseModel):
    value: Any
    hit_probability: float
    label: str
    delta_vs_base: float


class WhatIfResponse(BaseModel):
    varying_field: str
    base_hit_probability: float
    base_label: str
    results: List[WhatIfItem]


class MovieSearchItem(BaseModel):
    id: int
    title: str
    release_date: str
    budget: float
    revenue: float
    roi_ratio: float
    label: str
    primary_genre: str
    genres: List[str]
    director: str
    cast: List[str]
    production_companies: List[str]
    original_language: str
    runtime: float
    franchise: int
    vote_average: float
    vote_count: int
    popularity: float
    oof_hit_probability_A: Optional[float] = Field(None, description="Honest out-of-fold Model A probability")
    oof_hit_probability_B: Optional[float] = Field(None, description="Honest out-of-fold Model B probability")
    movie_input: MovieInput
