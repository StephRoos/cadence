# Cadence — Studio dataviz narrative animée

## Le projet
Cadence est une boîte à outils de canevas de visualisation paramétriques. Chaque graphe = une technique de dataviz éprouvée + une animation narrative qui raconte une histoire par le mouvement.

Cadence n'est pas un dashboard (Grafana), ni un chart builder (Datawrapper). Le différenciateur : l'animation narrative.

## Architecture

```
cadence/
  charts/           ← un dossier par type de graphe (canevas paramétrique)
    <type>/
      chart.js        ← rendu p5.js ou D3 — ne lit que config.json + data.json
      schema.json     ← contrat : structure attendue pour data.json
      config.example.json  ← paramètres par défaut
      index.html      ← wrapper
    <type>/
      DESIGN.md       ← choix de design, axes de généralisation
  adapters/         ← connecteurs : CSV, SQL, Excel → JSON conforme au schéma
  lib/              ← utilitaires partagés
  examples/         ← projets utilisant les canevas (carbon-witness, etc.)
```

Principe : `source (CSV/SQL/API) → adapter → data.json + config.json → chart.js → viz animée`

## Mon profil
ML engineer solide. JS notions de base. p5.js en cours d'apprentissage. D3 inconnu.

## Règles d'apprentissage
1. Max 10 lignes de code générées à la fois
2. Commenter chaque ligne non triviale
3. Poser une question après chaque bloc
4. Signaler si je copie sans comprendre
5. Donner 3 lignes à retaper de mémoire demain
6. Si je bloque sur un concept visuel — pointer vers une viz, pas expliquer la théorie

## Règles de conception
- Chaque canevas est paramétrique : aucune donnée en dur dans chart.js
- Tout vient de config.json (titre, couleurs, animation) et data.json (données)
- schema.json définit le contrat entre adapters et chart.js
- Techniques dataviz éprouvées uniquement — pas de visualisations abstraites
- L'animation sert la narration, pas la décoration
- Accessibilité : couleur + forme (pas couleur seule)
- Référence des techniques : `~/Documents/SecondBrain/02-Areas/dev/Bibliothèque Dataviz.md`

## Stack
- p5.js pour les canevas animés (phase actuelle)
- D3.js pour les canevas interactifs (phase suivante)
- Papa Parse pour l'adapter CSV navigateur
- Python/pandas pour les adapters côté serveur (uv pour les dépendances)

## Documentation
- Vault Obsidian SecondBrain : `~/Documents/SecondBrain/`
- Plan d'apprentissage : `~/Documents/SecondBrain/01-Projects/cadence/Plan Apprentissage Cadence.md`
- Bibliothèque dataviz : `~/Documents/SecondBrain/02-Areas/dev/Bibliothèque Dataviz.md`
- Notes p5.js : `~/Documents/SecondBrain/02-Areas/dev/p5.js Fondamentaux.md`

## Canevas — état actuel
- `animated-line` — ✅ Série temporelle + fan chart IPCC (migré depuis carbon-witness)
- `slope-chart` — ✅ Comparaison avant/après (émissions CO₂ par pays). Voir `DESIGN.md` pour les choix et axes de généralisation.
