"""
prepare_movies.py  -  Box-Office Hit/Flop project: data preparation pipeline
-----------------------------------------------------------------------------
Input  (put in ./data/):
    tmdb_5000_movies.csv      (Kaggle: TMDB 5000 Movie Dataset)
    tmdb_5000_credits.csv     (same dataset)
    movies_metadata.csv       (OPTIONAL, Kaggle: The Movies Dataset - for franchise flag)
Output (written to ./out/):
    movies_clean.csv          full cleaned table with every engineered feature
    modelA_prerelease.arff    Model A - only information known before release
    modelB_postrelease.arff   Model B - Model A + reception signals
    rules_nominal.arff        all-nominal table for Apriori / FP-Growth
    cluster_numeric.arff      numeric table for K-means / hierarchical clustering
    cleaning_log.txt          before/after counts for the report
Run:  python prepare_movies.py
"""
import ast, json, os, re
import numpy as np
import pandas as pd

DATA, OUT = "data", "out"
HIT_RATIO = 2.0          # Hit  <=> revenue >= 2 x budget
MIN_MONEY = 10_000       # budgets/revenues below this are treated as invalid (TMDB has 0, 1, 7 ...)
TOP_CAST = 3             # lead actors used for star-power features
os.makedirs(OUT, exist_ok=True)
log = []

def L(msg):
    print(msg); log.append(msg)

def parse_json_list(s, key="name"):
    """TMDB stores lists as stringified JSON, e.g. '[{"id": 28, "name": "Action"}]'."""
    if pd.isna(s) or s in ("", "[]"):
        return []
    try:
        items = json.loads(s)
    except (ValueError, TypeError):
        try:
            items = ast.literal_eval(s)          # movies_metadata.csv uses python-style quotes
        except (ValueError, SyntaxError):
            return []
    if isinstance(items, dict):
        items = [items]
    return [it.get(key) for it in items if isinstance(it, dict) and it.get(key) is not None]

# ---------------------------------------------------------------- 1. load + merge
movies = pd.read_csv(os.path.join(DATA, "tmdb_5000_movies.csv"))
credits = pd.read_csv(os.path.join(DATA, "tmdb_5000_credits.csv"))
credits = credits.rename(columns={"movie_id": "id"}).drop(columns=["title"], errors="ignore")
df = movies.merge(credits, on="id", how="left")
L(f"[load] movies={len(movies)} credits={len(credits)} merged={len(df)}")

# ---------------------------------------------------------------- 2. cleaning
n0 = len(df)
df = df.drop_duplicates(subset="id")
L(f"[clean] duplicates removed: {n0 - len(df)}")

if "status" in df.columns:
    n0 = len(df); df = df[df["status"] == "Released"]
    L(f"[clean] not-released removed: {n0 - len(df)}")

df["release_date"] = pd.to_datetime(df["release_date"], errors="coerce")
n0 = len(df); df = df[df["release_date"].notna()]
L(f"[clean] missing release_date removed: {n0 - len(df)}")

n_bad_budget = (df["budget"] < MIN_MONEY).sum()
n_bad_rev = (df["revenue"] < MIN_MONEY).sum()
n0 = len(df)
df = df[(df["budget"] >= MIN_MONEY) & (df["revenue"] >= MIN_MONEY)].copy()
L(f"[clean] invalid budget rows={n_bad_budget}, invalid revenue rows={n_bad_rev}, "
  f"removed together: {n0 - len(df)}  -> remaining {len(df)}")

df.loc[df["runtime"] <= 0, "runtime"] = np.nan
n_rt = df["runtime"].isna().sum()
df["runtime"] = df["runtime"].fillna(df["runtime"].median())
L(f"[clean] runtime missing/zero imputed with median: {n_rt}")

# ---------------------------------------------------------------- 3. target
df["roi_ratio"] = df["revenue"] / df["budget"]
df["label"] = np.where(df["roi_ratio"] >= HIT_RATIO, "Hit", "Flop")
df["label3"] = pd.cut(df["roi_ratio"], [-np.inf, 1.0, 2.5, np.inf],
                      labels=["Flop", "Average", "Hit"]).astype(str)
L(f"[target] Hit/Flop counts: {df['label'].value_counts().to_dict()}")
L(f"[target] 3-class counts: {df['label3'].value_counts().to_dict()}")

# ---------------------------------------------------------------- 4. descriptors
df["genres_list"] = df["genres"].apply(parse_json_list)
df["primary_genre"] = df["genres_list"].apply(lambda g: g[0] if g else "Unknown")
df["n_genres"] = df["genres_list"].apply(len)
TOP_GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Family",
              "Fantasy", "Horror", "Romance", "Science Fiction", "Thriller"]
for g in TOP_GENRES:
    df["g_" + g.replace(" ", "_")] = df["genres_list"].apply(lambda lst, g=g: int(g in lst))

df["companies"] = df["production_companies"].apply(parse_json_list)
top_companies = pd.Series([c for lst in df["companies"] for c in lst]).value_counts().head(10).index
df["big_studio"] = df["companies"].apply(lambda lst: int(any(c in top_companies for c in lst)))
df["is_english"] = (df["original_language"] == "en").astype(int)

df["release_year"] = df["release_date"].dt.year
df["release_month"] = df["release_date"].dt.month
def season(m):
    if m in (5, 6, 7): return "Summer"
    if m in (11, 12): return "Holiday"
    if m in (1, 2): return "Dump"
    return "Regular"
df["season"] = df["release_month"].apply(season)
df["holiday_flag"] = df["release_month"].isin([11, 12]).astype(int)

# ---------------------------------------------------------------- 5. franchise flag
df["keywords_list"] = df["keywords"].apply(parse_json_list) if "keywords" in df else [[]] * len(df)
meta_path = os.path.join(DATA, "movies_metadata.csv")
if os.path.exists(meta_path):
    meta = pd.read_csv(meta_path, low_memory=False, usecols=["id", "belongs_to_collection"])
    meta["id"] = pd.to_numeric(meta["id"], errors="coerce")
    meta["in_collection"] = meta["belongs_to_collection"].notna().astype(int)
    df = df.merge(meta[["id", "in_collection"]].drop_duplicates("id"), on="id", how="left")
    df["in_collection"] = df["in_collection"].fillna(0).astype(int)
    L("[franchise] collection flag taken from movies_metadata.csv")
else:
    df["in_collection"] = 0
    L("[franchise] movies_metadata.csv not found - using keyword/title heuristic only")
seq_kw = df["keywords_list"].apply(lambda k: int(any(w in ("sequel", "remake", "based on comic")
                                                     for w in k)))
seq_title = df["title"].str.contains(r"\b(?:2|3|4|5|II|III|IV|Part)\b", regex=True).astype(int)
df["franchise"] = ((df["in_collection"] + seq_kw + seq_title) > 0).astype(int)

# ---------------------------------------------------------------- 6. star power (NO leakage)
df["cast_list"] = df["cast"].apply(parse_json_list).apply(lambda c: c[:TOP_CAST])
def director_of(s):
    for p in (json.loads(s) if isinstance(s, str) else []):
        if p.get("job") == "Director":
            return p.get("name")
    return None
df["director"] = df["crew"].apply(director_of)

df = df.sort_values("release_date").reset_index(drop=True)
hist = {}                                   # person -> list of (revenue, is_hit)
cast_rev, cast_hit, cast_exp, dir_rev, dir_hit, dir_exp = ([] for _ in range(6))
for _, grp in df.groupby("release_date", sort=True):
    # compute features for every film on this date from STRICTLY earlier films ...
    for _, r in grp.iterrows():
        past = [h for a in r["cast_list"] for h in hist.get(("A", a), [])]
        cast_rev.append(np.mean([p[0] for p in past]) if past else np.nan)
        cast_hit.append(np.mean([p[1] for p in past]) if past else np.nan)
        cast_exp.append(len(past))
        dp = hist.get(("D", r["director"]), []) if r["director"] else []
        dir_rev.append(np.mean([p[0] for p in dp]) if dp else np.nan)
        dir_hit.append(np.mean([p[1] for p in dp]) if dp else np.nan)
        dir_exp.append(len(dp))
    # ... then add this date's films to history
    for _, r in grp.iterrows():
        rec = (r["revenue"], int(r["label"] == "Hit"))
        for a in r["cast_list"]:
            hist.setdefault(("A", a), []).append(rec)
        if r["director"]:
            hist.setdefault(("D", r["director"]), []).append(rec)
df["cast_avg_past_revenue"], df["cast_past_hit_rate"], df["cast_past_films"] = cast_rev, cast_hit, cast_exp
df["dir_avg_past_revenue"], df["dir_past_hit_rate"], df["dir_past_films"] = dir_rev, dir_hit, dir_exp
# newcomers: no history -> fill with 0 revenue / global prior hit rate, and keep the *_past_films=0 flag
prior = (df["label"] == "Hit").mean()
for c in ("cast_avg_past_revenue", "dir_avg_past_revenue"):
    df[c] = df[c].fillna(0)
for c in ("cast_past_hit_rate", "dir_past_hit_rate"):
    df[c] = df[c].fillna(prior)
L(f"[star] films with no cast history: {(df['cast_past_films'] == 0).sum()}, "
  f"no director history: {(df['dir_past_films'] == 0).sum()}")

# ---------------------------------------------------------------- 7. tiers / bins
def tertile(s, labels):
    return pd.qcut(s.rank(method="first"), 3, labels=labels).astype(str)
df["budget_tier"] = tertile(df["budget"], ["Low", "Medium", "High"])
df["runtime_bin"] = pd.cut(df["runtime"], [0, 95, 120, 1000], labels=["Short", "Standard", "Long"]).astype(str)
df["star_tier"] = tertile(df["cast_avg_past_revenue"], ["LowStar", "MidStar", "HighStar"])
df["director_tier"] = tertile(df["dir_avg_past_revenue"], ["LowDir", "MidDir", "HighDir"])
df["hype_level"] = tertile(df["vote_count"], ["LowHype", "MidHype", "HighHype"])        # post-release proxy
df["rating_band"] = pd.cut(df["vote_average"], [-1, 5.5, 6.5, 7.2, 11],
                           labels=["Poor", "Mixed", "Good", "Great"]).astype(str)
df["log_budget"] = np.log10(df["budget"])

# ---------------------------------------------------------------- 8. exports
keep = ["id", "title", "release_date", "release_year", "budget", "revenue", "roi_ratio", "label", "label3",
        "primary_genre", "n_genres", "runtime", "is_english", "big_studio", "franchise", "release_month",
        "season", "holiday_flag", "cast_avg_past_revenue", "cast_past_hit_rate", "cast_past_films",
        "dir_avg_past_revenue", "dir_past_hit_rate", "dir_past_films", "budget_tier", "runtime_bin",
        "star_tier", "director_tier", "hype_level", "rating_band", "vote_average", "vote_count",
        "popularity", "log_budget", "director"] + ["g_" + g.replace(" ", "_") for g in TOP_GENRES]
df[keep].to_csv(os.path.join(OUT, "movies_clean.csv"), index=False)

def q(v):
    """Make a nominal value ARFF-safe: 'Science Fiction' -> Science_Fiction (no quoting needed)."""
    return re.sub(r"[\s,{}'\"%]+", "_", str(v)).strip("_") or "Unknown"

def write_arff(frame, name, path, nominal):
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"@RELATION {name}\n\n")
        for c in frame.columns:
            if c in nominal:
                vals = sorted(frame[c].astype(str).unique())
                f.write(f"@ATTRIBUTE {c} {{{','.join(q(v) for v in vals)}}}\n")
            else:
                f.write(f"@ATTRIBUTE {c} NUMERIC\n")
        f.write("\n@DATA\n")
        for row in frame.itertuples(index=False):
            f.write(",".join(q(v) if c in nominal else
                             ("?" if pd.isna(v) else f"{float(v):.4f}")
                             for c, v in zip(frame.columns, row)) + "\n")
    L(f"[arff] {path}: {len(frame)} rows x {len(frame.columns)} attributes")

A_cols = ["log_budget", "runtime", "n_genres", "is_english", "big_studio", "franchise",
          "release_month", "holiday_flag", "cast_avg_past_revenue", "cast_past_hit_rate", "cast_past_films",
          "dir_avg_past_revenue", "dir_past_hit_rate", "dir_past_films", "primary_genre", "season"]
A_nom = {"primary_genre", "season", "is_english", "big_studio", "franchise", "holiday_flag", "label"}
write_arff(df[A_cols + ["label"]], "movies_modelA", os.path.join(OUT, "modelA_prerelease.arff"), A_nom)

B_cols = A_cols + ["vote_average", "vote_count", "popularity"]
write_arff(df[B_cols + ["label"]], "movies_modelB", os.path.join(OUT, "modelB_postrelease.arff"), A_nom)

R_cols = ["budget_tier", "primary_genre", "season", "runtime_bin", "star_tier", "director_tier",
          "franchise", "big_studio", "hype_level", "rating_band", "label"]
rules = df[R_cols].copy()
rules["franchise"] = rules["franchise"].map({1: "Franchise", 0: "Original"})
rules["big_studio"] = rules["big_studio"].map({1: "BigStudio", 0: "Indie"})
write_arff(rules, "movies_rules", os.path.join(OUT, "rules_nominal.arff"), set(R_cols))

C_cols = ["log_budget", "runtime", "cast_avg_past_revenue", "dir_avg_past_revenue",
          "vote_average", "vote_count", "popularity", "roi_ratio"]
write_arff(df[C_cols + ["label"]], "movies_cluster", os.path.join(OUT, "cluster_numeric.arff"), {"label"})

with open(os.path.join(OUT, "cleaning_log.txt"), "w") as f:
    f.write("\n".join(log))
print("done ->", OUT)
