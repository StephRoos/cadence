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

let progression = 0
let paused = false

function draw() {
  background(240, 33, 18)  // CADENCE.bg — Charcoal Dark

  // Titre
  noStroke()
  fill(190, 10, 97)        // CADENCE.text — Teal Pale
  textFont('monospace')
  textSize(14)
  textAlign(LEFT, BASELINE)
  text(config.title, margin.left, 28)

  // Sous-titre
  fill(215, 20, 72)        // CADENCE.textMuted — Slate Light
  textSize(10)
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

    // Barre
    noStroke()
    if (isHighlight) {
      fill(config.colors.highlight[0], config.colors.highlight[1], config.colors.highlight[2])
    } else {
      fill(config.colors.bar[0], config.colors.bar[1], config.colors.bar[2])
    }
    rect(margin.left, y - h / 2, barWidth, h, 0, 3, 3, 0)   // coins arrondis à droite

    // Label gauche — nom de la feature
    fill(isHighlight ? [190, 10, 97] : [215, 20, 72])
    textSize(11)
    textAlign(RIGHT, CENTER)
    text(b.label, margin.left - 8, y)

    // Valeur à droite de la barre — apparaît quand l'animation est terminée
    if (t >= 1) {
      fill(215, 20, 72)
      textSize(10)
      textAlign(LEFT, CENTER)
      text(b.value.toFixed(3), margin.left + barWidth + 6, y)
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
        fill(240, 31, 22, 92)   // CADENCE.bgCard
        rect(tx, ty, 80, 28, 3)
        fill(190, 10, 97)
        textSize(11)
        textFont('monospace')
        textAlign(LEFT, CENTER)
        text(sorted[i].value.toFixed(3), tx + 8, ty + 14)
        break
      }
    }

    // Hint
    fill(215, 20, 72, 50 + 20 * sin(frameCount * 0.04))
    noStroke()
    textSize(10)
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
