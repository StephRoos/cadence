"""
Adapter CSV → JSON pour Cadence (côté Python)

Usage :
    uv run adapters/from_csv.py input.csv output.json --columns year,value
"""
# /// script
# requires-python = ">=3.9"
# dependencies = ["pandas"]
# ///

import pandas as pd
import json
import sys
import argparse

def csv_to_json(input_path, output_path, columns=None, filters=None):
    """Convertit un CSV en JSON conforme aux schémas Cadence."""
    df = pd.read_csv(input_path)

    # Filtrer les colonnes si spécifié
    if columns:
        cols = [c.strip() for c in columns.split(',')]
        df = df[cols]

    # Filtrer les lignes si spécifié (ex: "country==France")
    if filters:
        for f in filters:
            col, val = f.split('==')
            df = df[df[col.strip()] == val.strip()]

    records = df.to_dict(orient='records')

    with open(output_path, 'w') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"{len(records)} entrées → {output_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='CSV → JSON pour Cadence')
    parser.add_argument('input', help='Fichier CSV source')
    parser.add_argument('output', help='Fichier JSON de sortie')
    parser.add_argument('--columns', help='Colonnes à garder (séparées par des virgules)')
    parser.add_argument('--filter', action='append', dest='filters',
                        help='Filtre col==val (peut être répété)')
    args = parser.parse_args()
    csv_to_json(args.input, args.output, args.columns, args.filters)
