let data
let config
let sorted  // barres triées, calculé une fois dans setup()

function preload() {
  data   = loadJSON('../../examples/ml-pro/feature-importance.json')
  config = loadJSON('config.example.json')
}

function setup() {
  createCanvas(min(windowWidth - 20, config.canvas.maxWidth), config.canvas.height)
  colorMode(HSB, 360, 100, 100, 100)

  // Trier et limiter le nombre de barres
  sorted = [...data.bars]
  if (config.sortBy === 'descending') sorted.sort((a, b) => b.value - a.value)
  if (config.sortBy === 'ascending')  sorted.sort((a, b) => a.value - b.value)
  sorted = sorted.slice(0, config.maxBars)                   // garder les N premières
}

function windowResized() {
  resizeCanvas(min(windowWidth - 20, config.canvas.maxWidth), config.canvas.height)
}

// Marges — large à gauche pour les labels
const margin = { top: 70, bottom: 30, left: 200, right: 40 }

// Échelle X : valeur → pixel (barre horizontale)
function valToX(val) {
  const vMax = sorted[0].value                                // la plus grande valeur (trié desc)
  return map(val, 0, vMax, margin.left, width - margin.right)
}

// Échelle Y : index de barre → pixel (espacement régulier)
function barY(i) {
  const zone = height - margin.top - margin.bottom            // hauteur utile
  const gap = zone / sorted.length                            // espacement par barre
  return margin.top + i * gap + gap / 2                       // centré dans sa bande
}

// Hauteur d'une barre — 60% de l'espacement (laisser de l'air)
function barH() {
  const zone = height - margin.top - margin.bottom
  return (zone / sorted.length) * 0.6
}

// Formater une valeur selon config.valueFormat (".3f" → 3 décimales, ".1f" → 1, etc.)
function formatValue(val) {
  const fmt = config.valueFormat || '.2f'
  const decimals = parseInt(fmt.replace(/\D/g, ''))           // extraire le nombre de ".3f"
  return val.toFixed(decimals)
}

let progression = 0
let paused = false

function draw() {
  background(...CADENCE.bg)

  // Titre
  noStroke()
  fill(...CADENCE.text)
  textFont(CADENCE.font, CADENCE.fontFallback)
  textSize(14)
  textAlign(LEFT, BASELINE)
  text(config.title, margin.left, 28)

  // Sous-titre
  fill(...CADENCE.textMuted)
  textSize(12)
  text(config.subtitle, margin.left, 46)

  // Avancer l'animation
  if (!paused) progression = min(progression + config.animation.speed, 1)

  // Dessiner les barres
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i]

    // Progression locale avec stagger
    const delay = i * config.animation.stagger
    const t = constrain((progression - delay) / (1 - delay), 0, 1)
    if (t === 0) continue

    const isHighlight = config.highlight.includes(b.label)
    const y = barY(i)
    const h = barH()
    const barWidth = (valToX(b.value) - margin.left) * t     // largeur animée

    // Barre — highlight en teal vif, les autres en teinte neutre
    noStroke()
    if (isHighlight) {
      const c = config.colors.highlight
      fill(c[0], c[1], c[2])
    } else {
      const c = config.colors.bar
      fill(c[0], c[1], c[2])
    }
    rect(margin.left, y - h / 2, barWidth, h, 0, 3, 3, 0)   // coins arrondis à droite

    // Label gauche
    fill(...CADENCE.text)
    textSize(12)
    textAlign(RIGHT, CENTER)
    if (isHighlight) textStyle(BOLD)                           // 2e canal : bold pour le highlight
    text(b.label, margin.left - 8, y)
    textStyle(NORMAL)

    // Valeur à droite de la barre — apparaît quand l'animation est terminée
    if (t >= 1) {
      fill(...CADENCE.textMuted)
      textSize(12)
      textAlign(LEFT, CENTER)
      text(formatValue(b.value), margin.left + barWidth + 6, y)
    }
  }

  // Hover interactif
  if (progression >= 1) {
    for (let i = 0; i < sorted.length; i++) {
      const y = barY(i)
      const h = barH()
      if (mouseY >= y - h / 2 && mouseY <= y + h / 2
          && mouseX >= margin.left && mouseX <= valToX(sorted[i].value)) {

        // Surbrillance
        noStroke()
        fill(config.colors.barHover[0], config.colors.barHover[1], config.colors.barHover[2], 30)
        rect(margin.left, y - h / 2, valToX(sorted[i].value) - margin.left, h, 0, 3, 3, 0)

        // Tooltip
        const tx = mouseX + 12
        const ty = y - 20
        fill(...CADENCE.bgCard, 92)
        rect(tx, ty, 80, 28, 3)
        fill(...CADENCE.text)
        textSize(12)
        textFont(CADENCE.font, CADENCE.fontFallback)
        textAlign(LEFT, CENTER)
        text(formatValue(sorted[i].value), tx + 8, ty + 14)
        break
      }
    }

    // Hint
    fill(...CADENCE.textMuted, 50 + 20 * sin(frameCount * 0.04))
    noStroke()
    textSize(12)
    textAlign(CENTER, BASELINE)
    text('double-clic pour relancer · espace = pause', width / 2, height - 8)
  }
}

function doubleClicked() {
  progression = 0
  paused = false
}

function keyPressed() {
  if (key === ' ') {
    paused = !paused
    return false
  }
}
