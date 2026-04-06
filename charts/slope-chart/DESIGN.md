# Slope Chart — Choix de design et généralisation

## Principe

Comparaison de valeurs entre deux points dans le temps. Chaque entité = une ligne dont la pente encode le changement. Technique inventée par Edward Tufte (1983).

## Choix de design actuels

### Highlight & Neutralize
1-2 entités en couleur vive, le reste en gris. Réduit le bruit visuel, guide l'attention vers l'histoire principale. Configurable via `config.highlight` et `config.colors`.

### Dodge bidirectionnel
Les labels proches sont écartés symétriquement autour de leur barycentre. Alternative disponible : dodge simple (greedy, pousse vers le bas uniquement). Choix via `config.dodge`.

### Tri narratif
Ordre d'apparition des lignes dans l'animation. 4 stratégies via `config.sortBy` :
- `narrative` : hausses décroissantes puis baisses (tension → espoir)
- `change` : plus grand changement absolu d'abord
- `start` : plus grande valeur de départ d'abord
- `data` : ordre du JSON

### Labels directs
Nom + valeur à gauche ET à droite de chaque ligne. Pas de légende séparée. Règle fondamentale du slope chart (Tufte).

### Lignes verticales de repère
Fines, très faible opacité. Aident à raccrocher visuellement les labels dodgés à leur point. Non paramétrable (élément structurel, pas narratif).

### Animation staggerée
Les lignes apparaissent séquentiellement. Le stagger occupe 50% du temps total, les 50% restants toutes les lignes se tracent. Contrôles : espace (pause), double-clic (replay).

## Axes de généralisation paramétrable

### Déjà paramétrique
| Paramètre | Fichier | Rôle |
|---|---|---|
| `title`, `subtitle` | config | Textes du graphe |
| `startLabel`, `endLabel` | config | En-têtes des colonnes |
| `unit` | config | Unité affichée dans le tooltip |
| `highlight` | config | Entités mises en avant |
| `colors.highlight` | config | Couleurs HSB par entité highlight |
| `colors.muted` | config | Couleur HSB des lignes secondaires |
| `sortBy` | config | Stratégie de tri / ordre d'animation |
| `dodge` | config | Algorithme de dodge (`simple` / `bidi`) |
| `animation.speed` | config | Vitesse globale (0→1 par frame) |
| `canvas.maxWidth`, `canvas.height` | config | Dimensions du canvas |
| `points[].label`, `start`, `end` | data | Données (conforme à schema.json) |

### A paramétrer (prochaines itérations)

| Paramètre | Valeur actuelle en dur | Généralisation |
|---|---|---|
| `margin` | `{top:80, bottom:40, left:160, right:160}` | → `config.margin` — marges adaptables selon la longueur des labels |
| `minGap` | `16` px | → `config.dodge.minGap` — espacement minimum entre labels |
| `maxDelay` | `0.5` (50% du temps pour le stagger) | → `config.animation.staggerRatio` |
| `background` | `(240, 30, 10)` HSB | → `config.colors.background` — thème clair/sombre |
| `font` | `monospace` | → `config.font` |
| `strokeWeight` highlight/muted | `3` / `1.5` | → `config.lineWeight.highlight` / `.muted` |
| `pointSize` | `6` px | → `config.pointSize` |
| `hover.threshold` | `20` px | → `config.hover.threshold` |
| `vMin` | `0` (ancré à zéro) | → `config.yMin` — permettre des axes non ancrés à zéro |
| Chemin vers `data.json` | En dur dans `preload()` | → URL param ou `config.dataPath` |

### Généralisation du schéma de données

Le schema actuel impose `start` / `end` (deux points). Extensions possibles :
- **Multi-colonnes** : `values: [v1, v2, v3]` + `labels: ["2000", "2010", "2023"]` — slope chart à 3+ colonnes (rare mais utile)
- **Métadonnées par point** : `group: "hausse"` pour contrôler le tri/couleur depuis les données plutôt que la config
- **Incertitude** : `startRange: [min, max]` — barres d'erreur aux extrémités

## Références

- Tufte, *The Visual Display of Quantitative Information* (1983)
- [Tufte — Slopegraphs for Comparing Gradients](https://www.edwardtufte.com/notebook/slopegraphs-for-comparing-gradients-slopegraph-theory-and-practice/)
- [Inforiver — Slopegraphs Guide](https://inforiver.com/insights/slopegraphs-guide/)
- [D3 Slope Chart — Observable](https://observablehq.com/@d3/slope-chart/3)
- Bibliothèque Dataviz : `~/Documents/SecondBrain/02-Areas/dev/Bibliothèque Dataviz.md`
