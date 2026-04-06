# Animated Line — Choix de design et généralisation

## Principe

Série temporelle animée avec fan charts d'incertitude. La courbe se trace progressivement de gauche à droite, les annotations apparaissent au passage, puis les scénarios de projection se déploient en fondu.

Technique : line chart + confidence band (fan chart). Référence : IPCC AR6, Bank of England inflation reports.

## Choix de design actuels

### Animation narrative en deux actes
1. **Acte 1** — La courbe historique se trace (1959→2025), les événements apparaissent au passage
2. **Pause narrative** — séparateur passé/futur, label "projections →" pulsant
3. **Acte 2** — Les scénarios IPCC se déploient en fondu (fan charts + médianes)

Le timing narratif est le coeur du canevas. L'animation n'est pas décorative — elle sépare le connu (données historiques) de l'incertain (projections).

### Fan charts IPCC
Bandes de percentiles p05-p95 (externe) et p25-p75 (interne). Convention standard de la littérature climatique. Opacité différenciée (12% externe, 25% interne) via `drawingContext.globalAlpha`.

### Accessibilité daltonisme
3 scénarios = 3 canaux visuels :
- Couleur : bleu (+1.5°C), orange (+2°C), rouge (+3°C)
- Style de ligne : solide, tirets `[8,4]`, pointillés `[3,3]`
- Position spatiale : les scénarios divergent naturellement

### Delta correction (ancrage)
Les projections IPCC sont ancrées sur la dernière valeur observée (2025) pour éviter un saut visuel. Le delta est constant sur toute la projection. C'est une convention de visualisation, pas une correction scientifique.

### Interpolation linéaire
Données IPCC à résolution 5 ans → interpolées en annuel pour une animation fluide. Formule : `t = k / span` entre deux points consécutifs.

### Événements historiques
Annotations contextuelles (Choc pétrolier, Sommet Rio, etc.) liées à l'année de la courbe. Apparaissent quand la progression atteint leur année.

## Axes de généralisation paramétrable

### Déjà paramétrique
| Paramètre | Fichier | Rôle |
|---|---|---|
| `title`, `source` | config | Textes du graphe |
| `unit` | config | Unité axe Y |
| `yMax` | config | Borne haute axe Y |
| `yearRange` | config | Intervalle temporel [début, fin] |
| `estimateFrom` | config | Année à partir de laquelle les données sont des estimations (pointillés) |
| `scenarios[]` | config | Clé, couleur HSB, dash pattern, label par scénario |
| `events[]` | config | Année, label, offset vertical |
| `animation.speed` | config | Vitesse de progression |
| `animation.pauseFrames` | config | Durée de la pause narrative |
| `animation.fadeSpeed` | config | Vitesse du fondu des scénarios |
| `canvas.maxWidth`, `canvas.height` | config | Dimensions |

### A paramétrer (prochaines itérations)

| Paramètre | Valeur actuelle en dur | Généralisation |
|---|---|---|
| `background` | `(240, 30, 10)` | → `lib/theme.js` CADENCE.bg |
| `font` | `monospace` | → `lib/theme.js` CADENCE.font |
| Couleurs texte | gris HSB variés | → `lib/theme.js` CADENCE.text / .textMuted |
| Chemin `data.json` | En dur dans `preload()` | → URL param `?data=...` |
| Chemin `config.json` | En dur dans `preload()` | → URL param `?config=...` |
| Marges | `50` (left), `120` (right offset) | → `config.margin` |
| Hover tooltip style | En dur | → `lib/theme.js` pour cohérence cross-canevas |

### Généralisation du schéma
Le schema actuel est spécifique aux émissions CO₂. Pour un canevas générique "animated-line" :
- `data.json` : tableau de `{x, y}` (pas `{year, gt}`)
- `scenarios.json` : optionnel, tableau de scénarios avec percentiles
- `events.json` : optionnel, annotations contextuelles

## Références

- IPCC AR6 — convention fan charts (p05/p25/p50/p75/p95)
- Bank of England — fan charts pour l'inflation
- Bloomberg — 138 Years of Climate Data (animated line de référence)
- Bibliothèque Dataviz : `~/Documents/SecondBrain/02-Areas/dev/Bibliothèque Dataviz.md`
