---
name: lit
description: "Audit dataviz d'un canevas Cadence contre la littérature, Tufte, accessibilité et identité Anthemion. Use when reviewing a chart canvas, checking best practices, or before finalizing a canevas."
disable-model-invocation: false
allowed-tools:
  - Read
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - Agent
---

# /lit — Audit conformité dataviz

Audit en lecture seule d'un canevas Cadence. Ne modifie aucun fichier.

## Workflow

### 1. Identifier le canevas

Détecter le type de graphe depuis le répertoire courant ou les arguments.
Si pas dans un dossier `charts/<type>/`, demander quel canevas auditer.

```
canvas_dir = charts/<type>/
```

### 2. Lire les fichiers du canevas

- `{canvas_dir}/chart.js` — code de rendu
- `{canvas_dir}/config.example.json` — paramètres
- `{canvas_dir}/schema.json` — contrat données
- `{canvas_dir}/DESIGN.md` — choix documentés (si présent)

### 3. Charger les références

- `~/Documents/SecondBrain/02-Areas/dev/Bibliothèque Dataviz.md` — techniques et bonnes pratiques
- `~/Documents/SecondBrain/01-Projects/identite-visuelle/Charte Graphique.md` — identité Anthemion
- `lib/theme.js` (si présent) — thème partagé Cadence

### 4. Recherche web

Lancer une recherche ciblée : `"<chart-type> best practices dataviz"` et `"<chart-type> accessibility"`.
Croiser avec les références de la Bibliothèque Dataviz (section Focus si elle existe).

### 5. Produire l'audit

Structurer le rapport en 6 sections. Pour chaque point : verdict (OK / A améliorer / Manquant), détail, référence.

## Format du rapport

```markdown
# Audit /lit — <type de graphe>

## 1. Tufte — Data-ink ratio
- **Data-ink ratio** : chaque élément visuel porte-t-il de l'information ?
- **Chartjunk** : éléments décoratifs sans valeur informationnelle ?
- **Lie factor** : les proportions visuelles reflètent-elles les données ?
- **Grille et axes** : minimum nécessaire ?

## 2. Littérature — Bonnes pratiques spécifiques
Vérifier les règles propres au type de graphe (ex: slope chart → labels directs, max 5-6 entités, dodge).
Croiser avec la section Focus de la Bibliothèque Dataviz si elle existe.
Citer les sources (Tufte, Inforiver, Observable, etc.)

## 3. Identité Anthemion
- **Palette** : couleurs conformes à la Charte Graphique ?
- **Typographie** : Geist Mono utilisé (ou fallback monospace) ?
- **Fond** : Charcoal Dark (#1e1e2e) ou équivalent HSB ?
- **Accents** : utilisation correcte Teal / Orange ?
- **Contrastes** : WCAG AA respecté ?

## 4. Accessibilité
- **Daltonisme** : l'information est-elle encodée par au moins 2 canaux (couleur + forme/épaisseur/style) ?
- **Contraste** : texte ≥ 4.5:1, éléments graphiques ≥ 3:1 ?
- **Clavier** : navigation possible sans souris ?
- **Lecteur d'écran** : alt text ou table de données alternative ?

## 5. Paramétrage
- Données en dur dans chart.js ? (devrait être dans data.json)
- Valeurs visuelles en dur ? (devrait être dans config.json ou lib/theme.js)
- Schema.json couvre-t-il tous les champs de data.json ?
- Config runtime via URL params supporté ?

## 6. Verdict — Améliorations par impact

| Priorité | Amélioration | Section | Impact |
|----------|-------------|---------|--------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |
```

## Règles

- Ne jamais modifier de fichiers — audit en lecture seule
- Citer les sources pour chaque recommandation
- Être factuel : OK / A améliorer / Manquant, pas de jugement vague
- Prioriser par impact sur l'utilisateur final, pas par facilité d'implémentation
