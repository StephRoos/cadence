"""
Télécharge les trajectoires individuelles d'émissions CO₂ depuis la base
IIASA AR6 Scenario Explorer (données publiques, pas d'auth requise).

Chaque trajectoire = un run modèle×scénario réel du GIEC AR6.
Filtre par catégorie de réchauffement : C1 (1.5°C), C3 (2°C), C7 (≥3°C).

Usage : uv run --with pyam-iamc adapters/fetch-iiasa-spaghetti.py
Output : examples/carbon-witness/spaghetti-trajectories.json
"""

import json
import random
import pyam
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out_path = root / "examples/carbon-witness/spaghetti-trajectories.json"

print("Connexion à IIASA AR6 Scenario Explorer...")
df = pyam.read_iiasa(
    "ar6-public",
    variable="Emissions|CO2",
    region="World",
)
print(f"  → {len(df)} scénarios chargés")

# Catégories de réchauffement IPCC
categories = {
    "+1.5°C": "C1",
    "+2°C":   "C3",
    "+3°C":   "C7",
}

MAX_TRAJ = 80      # trajectoires max par scénario (lisibilité)
random.seed(42)

output = {
    "years": None,
    "scenarios": {},
    "meta": {
        "source": "IIASA AR6 Scenario Explorer (ar6-public)",
        "variable": "Emissions|CO2",
        "unit": "GtCO2/yr",
        "region": "World",
        "categories": {k: v for k, v in categories.items()},
    }
}

for label, cat in categories.items():
    # Filtrer par catégorie via les métadonnées
    cat_models = df.meta[df.meta["Category"] == cat].index
    subset = df.filter(model=cat_models.get_level_values("model"),
                       scenario=cat_models.get_level_values("scenario"))
    print(f"{label} ({cat}): {len(subset)} scénarios")

    # Convertir en time series (colonnes = années)
    ts = subset.timeseries()

    # Garder les années 2020–2050 en pas de 5 ans (résolution native des IAMs)
    year_cols = [c for c in ts.columns if isinstance(c, int) and 2020 <= c <= 2050 and c % 5 == 0]
    ts = ts[year_cols].dropna()
    print(f"  → {len(ts)} runs complets sur {year_cols[0]}–{year_cols[-1]}")

    if output["years"] is None:
        output["years"] = year_cols

    # Mt CO₂ → Gt CO₂
    trajectories = []
    for _, row in ts.iterrows():
        traj = [round(row[y] / 1000, 2) for y in year_cols]
        trajectories.append(traj)

    if len(trajectories) > MAX_TRAJ:
        trajectories = random.sample(trajectories, MAX_TRAJ)
        print(f"  → échantillonné à {MAX_TRAJ} trajectoires")

    output["scenarios"][label] = trajectories

total = sum(len(v) for v in output["scenarios"].values())
print(f"\nTotal : {total} trajectoires réelles")

with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"✓ Sauvegardé : {out_path}")
