# Cadence

> **Statut : en pause depuis 2026-04-21.**
> Phase 1 (p5.js) terminée — 4 canevas livrés : `animated-line`, `slope-chart`, `bar-chart`, `spaghetti-plot`.
> Phase 2 (D3) en cours — 1 canevas livré (`scatterplot`), 7 restants (small-multiples, heatmap, bump-chart, annotated-line, stacked-area, connected-scatterplot, treemap).
> **Conditions de reprise** : nouveau canevas requis par Prisme (module 6 reporting) ou par un projet portfolio en cours.
> Cadence reste en submodule actif de Prisme — le code existant est consommé, pas modifié.
> Issues ouvertes étiquetées `on-hold`.

Studio de dataviz narrative animée.

Chaque graphe raconte une histoire par le mouvement — pas un dashboard, pas un chart builder. Une bibliothèque de canevas paramétriques où l'animation est le différenciateur.

## Architecture

```
cadence/
  charts/           ← un dossier par type de graphe (canevas paramétrique)
    animated-line/
    slope-chart/
  adapters/         ← connecteurs données : CSV, SQL, Excel, API → JSON
  lib/              ← utilitaires partagés (scales, animation, thème)
  examples/         ← projets utilisant les canevas Cadence
```

## Principe

```
Source (CSV, SQL, API…)
    ↓  adapter
data.json (schéma normalisé par type de graphe)
    +
config.json (titre, couleurs, animation, unités…)
    ↓
chart.js (canevas p5.js ou D3 — ne conna��t que JSON)
    ↓
Visualisation animée narrative
```

## Canevas disponibles

| Type | Technique | Situation | Status |
|------|-----------|-----------|--------|
| `animated-line` | Line + fan chart animé | Série temporelle + projections avec incertitude | En cours |
| `slope-chart` | Slope chart animé | Comparaison avant/après entre catégories | Prévu |

## Premier projet : Carbon Witness

Observatoire de la transition énergétique — utilise les canevas Cadence avec des données climatiques IPCC/OWID.
