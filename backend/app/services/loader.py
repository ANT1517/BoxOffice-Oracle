"""
backend/app/services/loader.py - High-performance singleton loader for all ML models and mining artifacts.
Loads all resources once into memory during application startup and validates integrity.
"""
import json
import os
from typing import Any, Dict, List, Optional
import joblib
import pandas as pd


class ArtifactStore:
    """In-memory cache for all models, lookup dictionaries, and mining artifacts."""
    def __init__(self):
        self.is_loaded: bool = False
        self.model_a: Any = None
        self.model_b: Any = None
        self.feature_context: Any = None
        
        # Lookups
        self.people_lookup: Dict[str, Dict[str, Any]] = {}
        self.studios_lookup: Dict[str, Any] = {}
        self.genres_lookup: Dict[str, Any] = {}
        self.languages_lookup: Dict[str, Any] = {}
        self.movies_search: List[Dict[str, Any]] = []
        self.movies_df: pd.DataFrame = pd.DataFrame()
        
        # Mining artifacts
        self.eda: Dict[str, Any] = {}
        self.olap_presets: Dict[str, Any] = {}
        self.rules: List[Dict[str, Any]] = []
        self.rules_benchmark: Dict[str, Any] = {}
        self.clusters_kmeans: Dict[str, Any] = {}
        self.clusters_hierarchical: Dict[str, Any] = {}
        self.models_metrics: Dict[str, Any] = {}
        self.models_significance: Dict[str, Any] = {}
        self.models_importance: Dict[str, Any] = {}
        self.models_card: Dict[str, Any] = {}
        self.tree_model_a: Dict[str, Any] = {}

    def load_all(self, base_dir: str = "."):
        """Load all models and artifacts with fail-fast validation."""
        required_paths = {
            "model_a": os.path.join(base_dir, "artifacts/models/model_A.joblib"),
            "model_b": os.path.join(base_dir, "artifacts/models/model_B.joblib"),
            "feature_context": os.path.join(base_dir, "artifacts/lookups/feature_context.joblib"),
            "people": os.path.join(base_dir, "artifacts/lookups/people.json"),
            "studios": os.path.join(base_dir, "artifacts/lookups/studios.json"),
            "genres": os.path.join(base_dir, "artifacts/lookups/genres.json"),
            "languages": os.path.join(base_dir, "artifacts/lookups/languages.json"),
            "movies_search": os.path.join(base_dir, "artifacts/lookups/movies_search.json"),
            "movies_df": os.path.join(base_dir, "artifacts/data/movies_clean.parquet"),
            "eda_summary": os.path.join(base_dir, "artifacts/eda/attribute_summary.json"),
            "eda_class": os.path.join(base_dir, "artifacts/eda/class_distribution.json"),
            "eda_hist": os.path.join(base_dir, "artifacts/eda/histograms.json"),
            "eda_hit_rates": os.path.join(base_dir, "artifacts/eda/hit_rates.json"),
            "eda_scatter": os.path.join(base_dir, "artifacts/eda/scatter.json"),
            "olap_presets": os.path.join(base_dir, "artifacts/olap/presets.json"),
            "rules": os.path.join(base_dir, "artifacts/rules/rules.json"),
            "rules_benchmark": os.path.join(base_dir, "artifacts/rules/benchmark.json"),
            "clusters_kmeans": os.path.join(base_dir, "artifacts/clusters/kmeans.json"),
            "clusters_hierarchical": os.path.join(base_dir, "artifacts/clusters/hierarchical.json"),
            "models_metrics": os.path.join(base_dir, "artifacts/models/metrics.json"),
            "models_significance": os.path.join(base_dir, "artifacts/models/significance.json"),
            "models_importance": os.path.join(base_dir, "artifacts/models/importance.json"),
            "models_card": os.path.join(base_dir, "artifacts/models/model_card.json"),
            "tree_model_a": os.path.join(base_dir, "artifacts/models/tree_model_A.json"),
        }

        # Check for missing files
        for key, path in required_paths.items():
            if not os.path.exists(path):
                raise FileNotFoundError(f"Critical BoxOffice Oracle artifact missing: '{path}' (key: {key})")

        # 1. Models & Context
        self.model_a = joblib.load(required_paths["model_a"])
        self.model_b = joblib.load(required_paths["model_b"])
        self.feature_context = joblib.load(required_paths["feature_context"])

        # 2. Lookups
        with open(required_paths["people"], "r", encoding="utf-8") as f:
            self.people_lookup = json.load(f)
        with open(required_paths["studios"], "r", encoding="utf-8") as f:
            self.studios_lookup = json.load(f)
        with open(required_paths["genres"], "r", encoding="utf-8") as f:
            self.genres_lookup = json.load(f)
        with open(required_paths["languages"], "r", encoding="utf-8") as f:
            self.languages_lookup = json.load(f)
        with open(required_paths["movies_search"], "r", encoding="utf-8") as f:
            self.movies_search = json.load(f)
        self.movies_df = pd.read_parquet(required_paths["movies_df"])

        # 3. EDA
        with open(required_paths["eda_summary"], "r", encoding="utf-8") as f:
            eda_sum = json.load(f)
        with open(required_paths["eda_class"], "r", encoding="utf-8") as f:
            eda_cls = json.load(f)
        with open(required_paths["eda_hist"], "r", encoding="utf-8") as f:
            eda_h = json.load(f)
        with open(required_paths["eda_hit_rates"], "r", encoding="utf-8") as f:
            eda_hr = json.load(f)
        with open(required_paths["eda_scatter"], "r", encoding="utf-8") as f:
            eda_sc = json.load(f)
        self.eda = {
            "attribute_summary": eda_sum,
            "class_distribution": eda_cls,
            "histograms": eda_h,
            "hit_rates": eda_hr,
            "scatter": eda_sc,
        }

        # 4. OLAP Presets
        with open(required_paths["olap_presets"], "r", encoding="utf-8") as f:
            self.olap_presets = json.load(f)

        # 5. Rules
        with open(required_paths["rules"], "r", encoding="utf-8") as f:
            self.rules = json.load(f)
        with open(required_paths["rules_benchmark"], "r", encoding="utf-8") as f:
            self.rules_benchmark = json.load(f)

        # 6. Clusters
        with open(required_paths["clusters_kmeans"], "r", encoding="utf-8") as f:
            self.clusters_kmeans = json.load(f)
        with open(required_paths["clusters_hierarchical"], "r", encoding="utf-8") as f:
            self.clusters_hierarchical = json.load(f)

        # 7. Models
        with open(required_paths["models_metrics"], "r", encoding="utf-8") as f:
            self.models_metrics = json.load(f)
        with open(required_paths["models_significance"], "r", encoding="utf-8") as f:
            self.models_significance = json.load(f)
        with open(required_paths["models_importance"], "r", encoding="utf-8") as f:
            self.models_importance = json.load(f)
        with open(required_paths["models_card"], "r", encoding="utf-8") as f:
            self.models_card = json.load(f)
        with open(required_paths["tree_model_a"], "r", encoding="utf-8") as f:
            self.tree_model_a = json.load(f)

        self.is_loaded = True


# Global singleton instance
store = ArtifactStore()


def get_store() -> ArtifactStore:
    """Return the global artifact store."""
    if not store.is_loaded:
        store.load_all()
    return store
