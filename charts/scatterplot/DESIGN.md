# Scatterplot — Choix de design et généralisation

## Principe

Nuage de points catégoriel pour visualiser la corrélation entre deux variables continues, avec régression linéaire par groupe. Premier canevas D3 de Cadence.

## Choix de design actuels

### Palette Okabe-Ito
Couleurs catégorielles colorblind-safe (Nature Methods 2008). Les couleurs sont définies en HSB dans `config.colors` et converties en HSL pour CSS via `hsbToHsl()`. Max 5 groupes par graphe (Few 2012).

### Régression linéaire par groupe
Moindres carrés ordinaires (OLS). Droite en tirets (`stroke-dasharray: 6 4`) pour la distinguer visuellement des données. Apparaît après l'animation des points du groupe.

### Animation séquentielle
Les groupes apparaissent un par un avec un décalage (`groupDelay = gi * (duration + gap)`). Chaque point s'anime individuellement (stagger). La régression apparaît à la fin de l'animation de chaque groupe. Sert la narration : le lecteur découvre les séries progressivement.

### Jitter + contour
Dispersion aléatoire de ±1.5× le rayon sur X et Y pour séparer les points superposés. Contour fin (`stroke: bg, 0.5px`) pour la lisibilité dans les zones denses. Le jitter est cosmétique (ne modifie pas les données), suffisamment faible pour ne pas induire de fausse lecture.

### Légende interactive + draggable
- **Clic** : isoler un groupe (toggle — re-clic pour réafficher tout)
- **Drag** : repositionner la légende librement (`d3.drag()`)

### Brush-to-filter
Sélection rectangulaire (`d3.brush()`) pour explorer les zones denses. Points sélectionnés en pleine opacité + rayon agrandi. Clic dans le vide = reset complet (groupes, régressions, légende).

### Tooltip
Fond `bgCard`, police Geist Mono. Affiche groupe, valeur X et valeur Y.

## Axes de généralisation paramétrable

### Déjà paramétrique
| Paramètre | Fichier | Rôle |
|---|---|---|
| `title`, `subtitle` | config | Textes du graphe |
| `xLabel`, `yLabel` | config | Labels des axes |
| `colors` | config | Couleurs HSB par groupe |
| `dataPath` | config | Chemin vers le fichier de données |
| `pointRadius` | config | Rayon des points |
| `pointAlpha` | config | Opacité des points |
| `animation.duration` | config | Durée d'animation par groupe |
| `animation.stagger` | config | Délai entre chaque point |
| `canvas.maxWidth`, `canvas.height` | config | Dimensions du SVG |
| `margin` | config | Marges (top, right, bottom, left) |
| `points[].x`, `y`, `group` | data | Données (conforme à schema.json) |

### A paramétrer (prochaines itérations)

| Paramètre | Valeur actuelle en dur | Généralisation |
|---|---|---|
| `groupGap` | `400` ms | → `config.animation.groupGap` — pause entre groupes |
| `jitterFactor` | `1.5 × pointRadius` | → `config.jitter` — amplitude (0 = pas de jitter) |
| `regression` | toujours affiché | → `config.regression: true/false` — masquer les régressions |
| `brush` | toujours actif | → `config.brush: true/false` — désactiver le brush |
| Ticks X/Y | `8` / `6` | → `config.xTicks`, `config.yTicks` |
| Légende position initiale | `width - margin.right - 130` | → `config.legend.x`, `config.legend.y` |

### Généralisation du schéma de données

Le schema actuel impose `x`, `y`, `group`. Extensions possibles :
- **Label par point** : `label: "2024-01-15"` — affiché dans le tooltip
- **Taille variable** : `size: 42` — bubble chart (rayon encode une 3e variable)
- **Couleur continue** : `value: 0.7` — gradient au lieu de catégories discrètes
- **Incertitude** : `xErr: [min, max]`, `yErr: [min, max]` — barres d'erreur

## Références

- Cleveland, *The Elements of Graphing Data* (1985) — scatterplot comme outil fondamental d'analyse exploratoire
- Few, *Show Me the Numbers* (2012) — max 5 couleurs catégorielles
- Okabe & Ito (2008) — palette colorblind-safe
- Wilke, *Fundamentals of Data Visualization* ch. 12 — scatterplot design
- Bibliothèque Dataviz : `~/Documents/SecondBrain/02-Areas/dev/Bibliothèque Dataviz.md`
