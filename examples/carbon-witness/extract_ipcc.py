"""
Extraction des émissions fossiles CO₂ IPCC AR6 via API IIASA
Base ar6-public : 3131 scénarios avec percentiles réels par catégorie IPCC
Catégories : C1 (~1.5°C), C3 (~2°C), C5-C6 (~3°C)
Output : scenarios-ipcc.json avec p05/p25/median/p75/p95 par année 2023–2050
"""
# /// script
# requires-python = ">=3.9"
# dependencies = ["pandas", "pyam-iamc"]
# ///

import pyam
import pandas as pd
import json

# Catégories AR6 WG3 (variable "Category" dans la base IIASA)
# C1 = limite 1.5°C sans dépassement ou dépassement limité
# C3 = limite 2°C
# C5 = > 2°C, ≤ 2.5°C  |  C6 = > 2.5°C, ≤ 3°C  →  on prend C5+C6 pour ~3°C
CATEGORIES = {
    "C1": "+1.5°C",
    "C3": "+2°C",
    "C6": "+3°C",
}

VARIABLE  = "Emissions|CO2|Energy and Industrial Processes"
YEARS     = list(range(2015, 2051))

print("Connexion à l'API IIASA AR6...")
conn = pyam.iiasa.Connection("ar6-public")

print("Chargement des métadonnées...")
meta = conn.meta()

output = {}

for cat, label in CATEGORIES.items():
    print(f"\nRequête {label} (catégorie {cat})...")

    # Scénarios appartenant à cette catégorie
    subset = meta[meta["Category"] == cat]
    if subset.empty:
        print(f"  Aucun scénario pour catégorie {cat}")
        continue

    models    = subset.index.get_level_values("model").tolist()
    scenarios = subset.index.get_level_values("scenario").tolist()
    print(f"  {len(models)} scénarios dans la catégorie")

    df = conn.query(
        variable=VARIABLE,
        region="World",
        model=models,
        scenario=scenarios,
    )

    if df.empty:
        print(f"  Aucune donnée de timeseries")
        continue

    data = df.timeseries()
    unit = df["unit"].iloc[0]
    divisor = 1000 if "Mt" in unit else 1

    print(f"  {len(data)} runs récupérés — unité : {unit}")

    # Filtrer les années cibles
    year_cols = [y for y in YEARS if y in data.columns]
    runs = data[year_cols].astype(float) / divisor

    pcts = runs.quantile([0.05, 0.25, 0.50, 0.75, 0.95])

    scenario_data = []
    for y in year_cols:
        scenario_data.append({
            "year":   y,
            "p05":    round(float(pcts.loc[0.05, y]), 2),
            "p25":    round(float(pcts.loc[0.25, y]), 2),
            "median": round(float(pcts.loc[0.50, y]), 2),
            "p75":    round(float(pcts.loc[0.75, y]), 2),
            "p95":    round(float(pcts.loc[0.95, y]), 2),
        })

    output[label] = scenario_data
    print(f"  2023 médiane : {scenario_data[0]['median']} GtCO₂/an")
    print(f"  2050 médiane : {scenario_data[-1]['median']} GtCO₂/an")
    print(f"  2050 p05–p95 : {scenario_data[-1]['p05']}–{scenario_data[-1]['p95']}")

with open("scenarios-ipcc.json", "w") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("\nscenarios-ipcc.json écrit.")
