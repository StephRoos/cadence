/**
 * Thème Cadence — Charte Anthemion traduite en HSB pour p5.js
 *
 * Usage dans chart.js :
 *   colorMode(HSB, 360, 100, 100, 100)
 *   background(...CADENCE.bg)
 *   fill(...CADENCE.text)
 *
 * Source : ~/Documents/SecondBrain/01-Projects/identite-visuelle/Charte Graphique.md
 */

const CADENCE = {

  // --- Fonds ---
  bg:        [240, 33, 18],    // Charcoal Dark  #1e1e2e — fond principal
  bgCard:    [240, 31, 22],    // Surface Dark   #262637 — cards, tooltips
  bgBorder:  [240, 25, 27],    // Border Dark    #313244 — séparations

  // --- Texte ---
  text:      [190, 10, 97],    // Teal Pale      #E0F4F8 — texte principal (16.84:1)
  textMuted: [215, 20, 72],    // Slate Light    #94A3B8 — texte secondaire
  textSubtle:[215, 28, 55],    // Slate          #64748B — labels discrets

  // --- Accents principaux ---
  teal:      [191, 96, 56],    // Bleu Paon      #067790 — titres, éléments décoratifs
  tealLight: [189, 94, 71],    // Teal Light     #0A9AB5 — liens, accents
  orange:    [24,  75, 75],    // Orange Brûlé   #C06A30 — CTA, points focaux
  amber:     [30,  54, 91],    // Amber Soft     #E8A96A — accent secondaire

  // --- Sémantiques ---
  success:   [160, 91, 73],    // #10B981
  warning:   [38,  93, 96],    // #F59E0B
  error:     [0,   72, 93],    // #EF4444

  // --- Repères visuels ---
  gridLine:  [240, 20, 25, 30],  // grille / lignes de repère (avec alpha)
  axisLabel: [215, 20, 60],      // labels d'axes

  // --- Polices ---
  font:      'Geist Mono',        // monospace Anthemion
  fontFallback: 'monospace',      // fallback si Geist non chargé
}
