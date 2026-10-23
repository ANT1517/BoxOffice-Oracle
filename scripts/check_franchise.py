import os, json, ast, re
import pandas as pd
import numpy as np

# Load raw tmdb data
movies = pd.read_csv('data/tmdb_5000_movies.csv')
credits = pd.read_csv('data/tmdb_5000_credits.csv').rename(columns={'movie_id': 'id'}).drop(columns=['title'], errors='ignore')
df = movies.merge(credits, on='id', how='left').drop_duplicates(subset='id')
df = df[df['status'] == 'Released']
df['release_date'] = pd.to_datetime(df['release_date'], errors='coerce')
df = df[df['release_date'].notna()]
df = df[(df['budget'] >= 10000) & (df['revenue'] >= 10000)].copy()

# Metadata collection id across all 45k rows
meta = pd.read_csv('data/movies_metadata.csv', low_memory=False, usecols=['id', 'title', 'release_date', 'belongs_to_collection'])
meta['id'] = pd.to_numeric(meta['id'], errors='coerce')
meta = meta.dropna(subset=['id']).drop_duplicates(subset=['id']).copy()
meta['id'] = meta['id'].astype(int)

def parse_coll_id(val):
    if pd.isna(val) or val in ('', '[]'):
        return None
    try:
        d = json.loads(val)
        if isinstance(d, dict) and 'id' in d:
            return int(d['id'])
    except:
        try:
            d = ast.literal_eval(val)
            if isinstance(d, dict) and 'id' in d:
                return int(d['id'])
        except:
            return None
    return None

meta['coll_id'] = meta['belongs_to_collection'].apply(parse_coll_id)
meta['release_date_parsed'] = pd.to_datetime(meta['release_date'], errors='coerce')

# Map collection_id -> list of (id, release_date) across ALL 45k movies
coll_dates = {}
for _, r in meta[meta['coll_id'].notna() & meta['release_date_parsed'].notna()].iterrows():
    cid = int(r['coll_id'])
    coll_dates.setdefault(cid, []).append((int(r['id']), r['release_date_parsed']))

df = df.merge(meta[['id', 'coll_id']], on='id', how='left')

def parse_json_list(val):
    if pd.isna(val) or not val:
        return []
    try:
        items = json.loads(val)
    except:
        try:
            items = ast.literal_eval(val)
        except:
            return []
    return [i.get('name') for i in items if isinstance(i, dict) and 'name' in i]

df['keywords_list'] = df['keywords'].apply(parse_json_list)

old_coll = df['coll_id'].notna().astype(int)
old_kw = df['keywords_list'].apply(lambda k: int(any(w in ('sequel', 'based on comic', 'remake') for w in k)))
old_title = df['title'].str.contains(r'\b(?:2|3|4|5|II|III|IV|Part)\b', regex=True).astype(int)
df['old_franchise'] = ((old_coll + old_kw + old_title) > 0).astype(int)

# New franchise flag (strictly earlier instalment in collection, no 'based on comic')
df['_temp_dt'] = pd.to_datetime(df['release_date'], errors='coerce')
def is_sequel_in_collection(row):
    cid = row['coll_id']
    if pd.isna(cid):
        return 0
    cid = int(cid)
    curr_id = int(row['id'])
    curr_dt = row['_temp_dt']
    if pd.isna(curr_dt):
        return 0
    dates = coll_dates.get(cid, [])
    for other_id, other_dt in dates:
        if other_id != curr_id and other_dt < curr_dt:
            return 1
    return 0

df['new_coll'] = df.apply(is_sequel_in_collection, axis=1)
new_kw = df['keywords_list'].apply(lambda k: int(any(w in ('sequel', 'remake') for w in k)))
df['new_franchise'] = ((df['new_coll'] + new_kw + old_title) > 0).astype(int)

old_count = int(df['old_franchise'].sum())
new_count = int(df['new_franchise'].sum())
changed = df[(df['old_franchise'] == 1) & (df['new_franchise'] == 0)]

print(f"Old Franchise Count: {old_count}")
print(f"New Franchise Count: {new_count}")
print(f"Total Changed (1 -> 0): {len(changed)}")

key_examples = [
    'Insidious',
    'Paranormal Activity',
    'Saw',
    'The Matrix',
    'Iron Man',
    'The Fast and the Furious',
    'Toy Story',
    'Despicable Me',
    'Transformers',
    'Pirates of the Caribbean: The Curse of the Black Pearl'
]

print("\nKey Canonical Films that changed from 1 to 0:")
for t in key_examples:
    m = df[df['title'] == t]
    if not m.empty:
        r = m.iloc[0]
        print(f"  - {r['title']} ({r['release_date'].year}): Old={r['old_franchise']} -> New={r['new_franchise']}")

print("\n10 Example Changed Films (Originals that spawned franchises):")
for idx, (_, r) in enumerate(changed.head(10).iterrows(), 1):
    print(f"  {idx}. {r['title']} ({r['release_date'].year}) [Revenue: ${r['revenue']:,.0f}, Budget: ${r['budget']:,.0f}]")
