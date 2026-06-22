---
date: 2026-04-06
tags: [cadence, apprentissage, data-viz, javascript, p5js, d3]
status: paused
paused_since: 2026-04-21
reprise: nouveau canevas requis par Prisme (module 6 reporting) ou projet portfolio en cours
updated: 2026-04-21
---

# Plan d'apprentissage — Cadence

> Construire une bibliothèque de canevas dataviz paramétriques, réutilisables pour n'importe quel jeu de données. Chaque canevas = une technique éprouvée + une animation narrative.

**Profil :** ML Engineer, JS notions de base, p5.js acquis, D3 à apprendre
**Projet :** Cadence — studio dataviz narrative animée
**Objectif :** portfolio + bibliothèque de démo + package Python (type Plotly)
**Référence :** [[Bibliothèque Dataviz]]
**Données :** toujours réelles et sourcées, jamais de simulations

---

## Matériau source — vizs existantes à retravailler

### Carbon Witness (Canvas API / p5.js)

| Viz existante | Technique | Retravailler en canevas Cadence |
|---|---|---|
| `bloomberg-copy.html` | Line chart annoté | → `charts/annotated-line` — série temporelle + annotations contextuelles |
| `emissions.html` | Line chart + seuil | → intégrer dans `annotated-line` (variante seuil) |
| `co2-trajectory.html` | Line + zone de confiance | → déjà couvert par `animated-line` ✅ |
| `flowingdata-copy.html` | Spaghetti plot | → déjà couvert par `spaghetti-plot` ✅ |
| `carbon-scenarios.html` | Enveloppes min/max/médiane | → déjà couvert par `animated-line` ✅ |

### Data Mastery (Plotly → réécrire en D3)

| Viz existante | Technique | Retravailler en canevas Cadence |
|---|---|---|
| `evolution_mensuelle_kwh.html` | Line chart | → couvert par `annotated-line` |
| `graphique_2_correlation.html` | Scatterplot | → `charts/scatterplot` |
| `graphique_3_heatmap.html` | Heatmap | → `charts/heatmap` |
| `scatter_production_defauts.html` | Scatterplot catégoriel | → variante de `scatterplot` avec groupes |
| `sunburst_consommation.html` | Sunburst / treemap | → `charts/treemap` |
| `conso_par_batiment.html` | Bar chart | → déjà couvert par `bar-chart` ✅ |

---

## Phase 1 — p5.js ✅ (terminée)

Canevas animés narratifs. Animation = le différenciateur.

| Canevas | Technique | Source | Statut |
|---|---|---|---|
| `animated-line` | Série temporelle + fan chart | Carbon Witness / IPCC AR6 | ✅ |
| `slope-chart` | Comparaison avant/après | OWID/GCP | ✅ |
| `bar-chart` | Barres horizontales animées | ML-Pro | ✅ |
| `spaghetti-plot` | N trajectoires + opacité | IIASA AR6 (runs IAM réels) | ✅ |

**Concepts acquis :** setup/draw, map, colorMode(HSB), lerp, constrain, beginShape/vertex, stagger, dodge (greedy + bidi), alpha cumulatif, drawingContext, highlight & neutralize, CADENCE.* theme

---

## Phase 2 — D3.js (en cours)

Transition vers D3 : SVG interactif, export vectoriel, écosystème Observable.
Les canevas restants (small-multiples, bump-chart) passent en D3 — meilleur investissement d'apprentissage.

| Canevas | Technique | Source | Statut | Concepts à acquérir |
|---|---|---|---|---|
| `scatterplot` | Corrélation + régression | Data Mastery | ✅ | D3 scales, axes, enter/update/exit, circles, brush, drag |
| `small-multiples` | Grille de sous-graphes | NYT covid / OWID | A faire | D3 grille SVG, état synchronisé |
| `heatmap` | Matrice colorée | Data Mastery | A faire | D3 color scales, interpolation |
| `bump-chart` | Classement animé | OWID émetteurs | A faire | D3 transitions, position animée |
| `annotated-line` | Série + annotations | Bloomberg/Carbon Witness | A faire | D3 annotations, responsive |
| `stacked-area` | Composition qui évolue | OWID énergie | A faire | D3 stack, area generator |
| `connected-scatterplot` | Temps encodé dans le mouvement | Gapminder | A faire | D3 transitions, path animation |
| `treemap` | Hiérarchie animée | Data Mastery | A faire | D3 layouts, hierarchy |

### Ordre recommandé

1. **`scatterplot`** — hello world D3 (scales + axes + circles)
2. **`small-multiples`** — grille SVG, plus naturel en D3 qu'en canvas
3. **`heatmap`** — renforce scales + introduit color scales
4. **`bump-chart`** — transitions D3 (positions qui bougent)
5. **`annotated-line`** — migration bloomberg-copy avec annotations D3
6. **`stacked-area`** — stack layout, area generator
7. **`connected-scatterplot`** — transitions avancées, path animation
8. **`treemap`** — layouts hiérarchiques, le plus avancé

---

## Phase 3 — Assemblage narratif + package Python

Combiner plusieurs canevas en histoires interactives et packager en librairie Python.

| Projet | Technique | Canevas utilisés |
|---|---|---|
| Carbon Witness v2 | Scrollytelling | animated-line + slope-chart + stacked-area + small-multiples |
| Data Mastery démo | Stepper interactif | scatterplot + heatmap + bar-chart |
| Package `cadence` | Librairie Python (Jupyter) | tous les canevas |

Concepts : Scrollama, intersection observer, état partagé entre canevas.

### Package Python `cadence`

Objectif : utiliser les canevas Cadence depuis un Jupyter notebook via une API Python type Plotly.

```python
from cadence import SpaghettiPlot
SpaghettiPlot(data=df, scenarios={...}, line_alpha=12).show()
```

| Étape | Description | Concepts à acquérir |
|---|---|---|
| Embedding HTML | Injecter config+data JSON dans un template HTML via `IPython.display.HTML` | ipywidgets, templating |
| Classe par canevas | Une classe Python par type de graphe, DataFrame → JSON conforme au schema.json | packaging Python, API design |
| Export statique | PNG/SVG via headless browser (Playwright) | Playwright, export |
| SVG natif | Les canevas D3 produisent du SVG → export vectoriel direct sans headless | — |

---

## Progression des compétences

| Concept | Phase | Canevas où c'est appris |
|---|---|---|
| `setup()/draw()`, `map()`, `colorMode()` | 1 | animated-line ✅ |
| `beginShape()/vertex()`, fan charts | 1 | animated-line ✅ |
| `lerp()`, `constrain()`, stagger | 1 | slope-chart ✅ |
| Algorithme dodge (greedy + bidi) | 1 | slope-chart ✅ |
| `sort()` animé, highlight & bold | 1 | bar-chart ✅ |
| Alpha cumulatif, densité visuelle | 1 | spaghetti-plot ✅ |
| D3 scales, axes, enter/update/exit | 2 | scatterplot |
| D3 grille SVG, synchronisation | 2 | small-multiples |
| D3 color scales, interpolation | 2 | heatmap |
| D3 transitions, position animée | 2 | bump-chart |
| D3 annotations, responsive | 2 | annotated-line |
| D3 stack, area generator | 2 | stacked-area |
| D3 transitions, path animation | 2 | connected-scatterplot |
| D3 layouts, hierarchy | 2 | treemap |
| Scrollama, état partagé | 3 | Carbon Witness v2 |
| Package Python, embedding Jupyter | 3 | package cadence |

---

## Règles de conception (rappel)

- Chaque canevas est paramétrique : `config.json` + `data.json` + `schema.json`
- `DESIGN.md` dans chaque dossier : choix, références, axes de généralisation
- Techniques éprouvées uniquement — ref [[Bibliothèque Dataviz]]
- Animation = narration, pas décoration
- Accessibilité : couleur + forme (pas couleur seule)
- Données toujours réelles et sourcées
- Mettre à jour la Bibliothèque Dataviz (colonne Maîtrise) après chaque canevas terminé

---

## Liens

- [[Bibliothèque Dataviz]] — référence des techniques par situation
- [[p5.js Fondamentaux]] — concepts p5.js acquis
- Repo Cadence : `~/projets/cadence`
- Repo Carbon Witness : `~/projets/carbon-witness`
- Data Mastery vizs : `~/projets/data-mastery-1.1-fondations/output/`
