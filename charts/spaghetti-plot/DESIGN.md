# Spaghetti Plot — Choix de design

## Technique
Spaghetti plot = N trajectoires semi-transparentes superposées. La densité visuelle encode la probabilité — là où les lignes se concentrent, le scénario est plus probable.

## Données
- **Source** : IIASA AR6 Scenario Explorer (base publique)
- **Variable** : `Emissions|CO2`, région World, unité Mt CO₂/yr → convertie en Gt
- **Catégories** : C1 (+1.5°C), C3 (+2°C), C7 (+3°C)
- **Runs** : 80 trajectoires par scénario, échantillonnées parmi 117/411/173 runs réels de modèles IAM (MESSAGE, REMIND, IMAGE, etc.)
- **Résolution** : pas de 5 ans (2020–2050), résolution native des IAMs
- **Pas de données simulées** — chaque ligne est un vrai run de modèle

## Choix visuels
- **Alpha faible** (12/100) : une ligne seule quasi invisible, la densité cumulative crée le signal
- **Médiane par scénario** : trait épais + tirets différents (accessibilité daltonisme)
- **3 couleurs max** : bleu (1.5°C), orange (2°C), rouge (3°C) — cohérent avec animated-line
- **yRange [-10, 70]** : inclut les émissions négatives (BECCS) des scénarios C1
- **Labels directs** à 2050, pas de légende séparée
- **Interpolation linéaire** entre les pas de 5 ans pour une animation fluide (lerp)

## Différence avec un line chart
Un line chart montre des séries identifiables (chaque ligne = une entité). Un spaghetti plot montre une distribution — l'individu n'importe pas, c'est la concentration du faisceau qui porte le message.

## Axes de généralisation
- `config.lineAlpha` : contrôle la transparence individuelle (dépend du nombre de trajectoires)
- `config.yRange` : bornes Y paramétriques
- `config.scenarios` : liste de scénarios avec clé, couleur HSB, style de tirets
- Adapter `fetch-iiasa-spaghetti.py` : changeable pour d'autres variables IIASA (température, énergie, etc.)

## Références
- data-to-viz.com/caveat/spaghetti.html — design principles
- Few (2012) — max 2–3 couleurs, highlight & neutralize
- Tufte — data-ink ratio, pas de chartjunk
