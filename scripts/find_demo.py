import json
import pandas as pd

df = pd.read_parquet('artifacts/data/movies_clean.parquet')
with open('artifacts/models/oof_predictions.json') as f:
    oof = json.load(f)

df['id_str'] = df['id'].astype(str)
df['p_A'] = df['id_str'].apply(lambda x: oof.get(x, {}).get('oof_hit_probability_A'))
df['p_B'] = df['id_str'].apply(lambda x: oof.get(x, {}).get('oof_hit_probability_B'))

cands = df[(df['budget'] >= 30_000_000) & (df['budget'] <= 60_000_000) & (df['franchise'] == 0) & (df['label'] == 'Flop') & (df['release_year'] >= 2000)]
print('=== Post-2000 Mid-Budget Original Flops ===')
for _, r in cands.head(15).iterrows():
    b_mil = r['budget'] / 1e6
    roi = r['roi_ratio']
    print(f"ID={r['id']}: {r['title']} ({r['release_year']}) | Budget=${b_mil:.1f}M | ROI={roi:.2f}x | p_A={r['p_A']:.4f} | p_B={r['p_B']:.4f}")
