"""
Adapter Excel → JSON pour Cadence (côté Python)

Usage :
    uv run adapters/from_excel.py input.xlsx output.json --sheet "Sheet1" --columns year,value
"""
# /// script
# requires-python = ">=3.9"
# dependencies = ["pandas", "openpyxl"]
# ///

import pandas as pd
import json
import argparse

def excel_to_json(input_path, output_path, sheet=None, columns=None):
    """Convertit un fichier Excel en JSON conforme Cadence."""
    kwargs = {}
    if sheet:
        kwargs['sheet_name'] = sheet

    df = pd.read_excel(input_path, **kwargs)

    if columns:
        cols = [c.strip() for c in columns.split(',')]
        df = df[cols]

    records = df.to_dict(orient='records')

    with open(output_path, 'w') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"{len(records)} entrées → {output_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Excel → JSON pour Cadence')
    parser.add_argument('input', help='Fichier Excel source (.xlsx)')
    parser.add_argument('output', help='Fichier JSON de sortie')
    parser.add_argument('--sheet', help='Nom de la feuille')
    parser.add_argument('--columns', help='Colonnes à garder (séparées par des virgules)')
    args = parser.parse_args()
    excel_to_json(args.input, args.output, args.sheet, args.columns)
