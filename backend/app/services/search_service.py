"""
backend/app/services/search_service.py - Fast fuzzy search for actors, directors, and movies.
Combines sub-millisecond prefix matching with RapidFuzz fuzzy similarity scoring.
"""
from typing import List, Optional
from rapidfuzz import fuzz, process

from backend.app.schemas.movie import MovieInput, MovieSearchItem
from backend.app.schemas.people import PersonSearchItem
from backend.app.services.loader import get_store


def search_people(q: str, role: Optional[str] = None, limit: int = 10) -> List[PersonSearchItem]:
    """
    Fuzzy search for actors and directors in the historical lookup index.
    Filters by role ('cast'/'actor' or 'director') and returns track record metadata.
    """
    store = get_store()
    q_clean = q.strip()
    if not q_clean:
        return []

    # Map query role filter
    target_role = None
    if role:
        r_lower = role.strip().lower()
        if r_lower in ("actor", "cast"):
            target_role = "actor"
        elif r_lower == "director":
            target_role = "director"

    # Candidate pool based on role
    candidate_names = []
    for name, p_data in store.people_lookup.items():
        if target_role and target_role not in p_data.get("roles", []):
            continue
        candidate_names.append(name)

    if not candidate_names:
        return []

    # 1. Fast prefix/substring match
    q_lower = q_clean.lower()
    prefix_matches = [name for name in candidate_names if name.lower().startswith(q_lower)]
    substring_matches = [
        name for name in candidate_names if q_lower in name.lower() and name not in prefix_matches
    ]
    ranked_names = (prefix_matches + substring_matches)[:limit]

    # 2. Fuzzy fallback if fewer than limit matches
    if len(ranked_names) < limit:
        fuzzy_results = process.extract(
            q_clean,
            candidate_names,
            scorer=fuzz.WRatio,
            limit=limit * 2,
        )
        for name, score, _ in fuzzy_results:
            if score >= 65 and name not in ranked_names:
                ranked_names.append(name)
                if len(ranked_names) >= limit:
                    break

    items: List[PersonSearchItem] = []
    for name in ranked_names[:limit]:
        p = store.people_lookup[name]
        films = p.get("films", [])
        last_year = None
        if films:
            dates = [f.get("release_date") for f in films if f.get("release_date")]
            if dates:
                last_year = max(int(str(d)[:4]) for d in dates if str(d)[:4].isdigit())

        items.append(
            PersonSearchItem(
                name=name,
                roles=p.get("roles", []),
                film_count=int(p.get("total_films", 0)),
                last_film_year=last_year,
                avg_past_revenue=round(float(p.get("avg_revenue", 0.0)), 2),
                past_hit_rate=round(float(p.get("hit_rate", 0.0)), 4),
            )
        )

    return items


def search_movies(q: str, limit: int = 10) -> List[MovieSearchItem]:
    """
    Search dataset movies by title to pre-populate what-if scenarios or inspect historical records.
    """
    store = get_store()
    q_clean = q.strip()
    if not q_clean:
        # Return top 10 movies by popularity if query is empty
        sorted_popular = sorted(store.movies_search, key=lambda x: x["popularity"], reverse=True)
        return [MovieSearchItem(**m) for m in sorted_popular[:limit]]

    titles = [m["title"] for m in store.movies_search]
    q_lower = q_clean.lower()

    # 1. Prefix / Substring matches
    prefix_matches = [i for i, t in enumerate(titles) if t.lower().startswith(q_lower)]
    substring_matches = [
        i for i, t in enumerate(titles) if q_lower in t.lower() and i not in prefix_matches
    ]
    ranked_indices = (prefix_matches + substring_matches)[:limit]

    # 2. Fuzzy fallback
    if len(ranked_indices) < limit:
        fuzzy_results = process.extract(
            q_clean,
            titles,
            scorer=fuzz.WRatio,
            limit=limit * 2,
        )
        for _, score, idx in fuzzy_results:
            if score >= 65 and idx not in ranked_indices:
                ranked_indices.append(idx)
                if len(ranked_indices) >= limit:
                    break

    results: List[MovieSearchItem] = []
    for idx in ranked_indices[:limit]:
        m_data = store.movies_search[idx]
        results.append(MovieSearchItem(**m_data))

    return results
