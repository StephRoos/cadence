"""
Adapter SQL → JSON pour Cadence (côté Python)

Usage :
    uv run adapters/from_sql.py "sqlite:///data.db" "SELECT year, value FROM emissions" output.json
"""
# /// script
# requires-python = ">=3.9"
# dependencies = ["pandas", "sqlalchemy"]
# ///

import pandas as pd
import json
import argparse

def sql_to_json(connection_string, query, output_path):
    """Exécute une requête SQL et exporte en JSON conforme Cadence."""
    df = pd.read_sql(query, connection_string)
    records = df.to_dict(orient='records')

    with open(output_path, 'w') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"{len(records)} entrées → {output_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='SQL → JSON pour Cadence')
    parser.add_argument('connection', help='Connection string SQLAlchemy (ex: sqlite:///data.db, postgresql://...)')
    parser.add_argument('query', help='Requête SQL')
    parser.add_argument('output', help='Fichier JSON de sortie')
    args = parser.parse_args()
    sql_to_json(args.connection, args.query, args.output)
