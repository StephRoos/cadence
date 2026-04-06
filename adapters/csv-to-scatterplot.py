"""
Convertit production_industrielle.csv en JSON pour le scatterplot Cadence.
Agrège par date+ligne : somme des quantités produites et défauts.

Usage : uv run --with pandas adapters/csv-to-scatterplot.py
Output : examples/data-mastery/production-defauts.json
"""

import json
import pandas as pd
from pathlib import Path

src = Path("~/projets/data-mastery-1.1-fondations/data/production_industrielle.csv").expanduser()
out = Path(__file__).resolve().parent.parent / "examples/data-mastery/production-defauts.json"
out.parent.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(src)

# Agréger par date + ligne : somme production et défauts
agg = df.groupby(["date", "ligne"]).agg(
    production=("quantite_produite", "sum"),
    defauts=("quantite_defauts", "sum"),
).reset_index()

# Filtrer les valeurs aberrantes (défauts négatifs = corrections de stock)
agg = agg[agg["defauts"] >= 0]

# Convertir en liste de points
points = []
for _, row in agg.iterrows():
    points.append({
        "x": int(row["production"]),
        "y": int(row["defauts"]),
        "group": row["ligne"],
        "date": row["date"],
    })

output = {
    "points": points,
    "meta": {
        "source": "Data Mastery 1.1 — production_industrielle.csv",
        "xLabel": "Quantité produite",
        "yLabel": "Quantité de défauts",
    }
}

with open(out, "w") as f:
    json.dump(output, f, indent=2)

print(f"✓ {len(points)} points, {agg['ligne'].nunique()} groupes")
print(f"  X: {agg['production'].min()}–{agg['production'].max()}")
print(f"  Y: {agg['defauts'].min()}–{agg['defauts'].max()}")
print(f"  → {out}")
