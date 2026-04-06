let data       // { years: [...], scenarios: { "+1.5°C": [[...], ...], ... } }
let config

function preload() {
  data   = loadJSON('../../examples/carbon-witness/spaghetti-trajectories.json')
  config = loadJSON('config.example.json')
}

function setup() {
  createCanvas(min(windowWidth - 20, config.canvas.maxWidth), config.canvas.height)
  colorMode(HSB, 360, 100, 100, 100)
}

function windowResized() {
  resizeCanvas(min(windowWidth - 20, config.canvas.maxWidth), config.canvas.height)
}

const margin = { top: 70, bottom: 40, left: 60, right: 80 }

function yearToX(year) {
  return map(year, data.years[0], data.years[data.years.length - 1],
             margin.left, width - margin.right)
}

function valToY(val) {
  return map(val, config.yRange[0], config.yRange[1],
             height - margin.bottom, margin.top)
}

let progression = 0
let paused = false

function draw() {
  background(...CADENCE.bg)

  // Titre + sous-titre
  noStroke()
  fill(...CADENCE.text)
  textFont(CADENCE.font, CADENCE.fontFallback)
  textSize(14)
  textAlign(LEFT, BASELINE)
  text(config.title, margin.left, 28)
  fill(...CADENCE.textMuted)
  textSize(12)
  text(config.subtitle, margin.left, 46)

  // Label axe Y — unité
  fill(...CADENCE.textSubtle)
  textSize(12)
  textAlign(LEFT, BASELINE)
  text(config.unit, margin.left, margin.top - 10)

  // Grille horizontale
  const yTicks = []
  for (let v = config.yRange[0]; v <= config.yRange[1]; v += 10) yTicks.push(v)
  for (const v of yTicks) {
    stroke(...CADENCE.gridLine)
    strokeWeight(1)
    line(margin.left, valToY(v), width - margin.right, valToY(v))
    noStroke()
    fill(...CADENCE.axisLabel)
    textSize(12)
    textAlign(RIGHT, CENTER)
    text(v, margin.left - 8, valToY(v))
  }

  // Axe X — années (dynamique depuis les données)
  const xTicks = data.years
  for (const year of xTicks) {
    stroke(...CADENCE.gridLine)
    strokeWeight(1)
    line(yearToX(year), height - margin.bottom + 5, yearToX(year), height - margin.bottom)
    noStroke()
    fill(...CADENCE.axisLabel)
    textSize(12)
    textAlign(CENTER, TOP)
    text(year, yearToX(year), height - margin.bottom + 8)
  }

  // Animation — progression continue entre 0 et data.years.length - 1
  // Ex: 2.7 = le 3e point complet + 70% du chemin vers le 4e
  if (!paused) progression = min(progression + config.animation.speed, data.years.length - 1)
  const nFull = floor(progression)              // nombre de segments complets
  const frac  = progression - nFull             // fraction du segment en cours (0→1)

  // Trajectoires — une boucle par scénario
  for (const sc of config.scenarios) {
    const trajs = data.scenarios[sc.key]
    const [h, s, b] = sc.color

    // Chaque trajectoire = une ligne semi-transparente
    // Interpolation linéaire entre les pas de 5 ans pour une animation fluide
    for (const traj of trajs) {
      stroke(h, s, b, config.lineAlpha)
      strokeWeight(1)
      noFill()
      beginShape()
      for (let i = 0; i <= nFull; i++) {
        vertex(yearToX(data.years[i]), valToY(traj[i]))
      }
      // Point intermédiaire — tête de la ligne entre deux pas de 5 ans
      if (frac > 0 && nFull < data.years.length - 1) {
        const headX = lerp(yearToX(data.years[nFull]), yearToX(data.years[nFull + 1]), frac)
        const headY = lerp(valToY(traj[nFull]), valToY(traj[nFull + 1]), frac)
        vertex(headX, headY)
      }
      endShape()
    }

    // Médiane — calculée à la volée, trait plus épais et opaque
    stroke(h, s, b, config.medianAlpha)
    strokeWeight(2)
    if (sc.dash.length) drawingContext.setLineDash(sc.dash)
    noFill()
    beginShape()
    for (let i = 0; i <= nFull; i++) {
      const vals = trajs.map(t => t[i]).sort((a, b) => a - b)
      vertex(yearToX(data.years[i]), valToY(vals[floor(vals.length / 2)]))
    }
    if (frac > 0 && nFull < data.years.length - 1) {
      const valsA = trajs.map(t => t[nFull]).sort((a, b) => a - b)
      const valsB = trajs.map(t => t[nFull + 1]).sort((a, b) => a - b)
      const medA = valsA[floor(valsA.length / 2)]
      const medB = valsB[floor(valsB.length / 2)]
      vertex(
        lerp(yearToX(data.years[nFull]), yearToX(data.years[nFull + 1]), frac),
        lerp(valToY(medA), valToY(medB), frac)
      )
    }
    endShape()
    drawingContext.setLineDash([])

    // Label du scénario à droite — apparaît quand l'animation est terminée
    if (progression >= data.years.length - 1) {
      const vals = trajs.map(t => t[data.years.length - 1]).sort((a, b) => a - b)
      const medianY = valToY(vals[floor(vals.length / 2)])
      noStroke()
      fill(h, s, b)
      textSize(12)
      textAlign(LEFT, CENTER)
      text(sc.key, width - margin.right + 10, medianY)
    }
  }

  // Hover — afficher l'année et les médianes sous la souris
  if (progression >= data.years.length - 1
      && mouseX >= margin.left && mouseX <= width - margin.right
      && mouseY >= margin.top && mouseY <= height - margin.bottom) {

    // Trouver l'année la plus proche
    const ratio = (mouseX - margin.left) / (width - margin.right - margin.left)
    const yearIdx = constrain(round(ratio * (data.years.length - 1)), 0, data.years.length - 1)
    const hoverYear = data.years[yearIdx]
    const hx = yearToX(hoverYear)

    // Ligne verticale
    stroke(...CADENCE.textMuted, 40)
    strokeWeight(1)
    line(hx, margin.top, hx, height - margin.bottom)

    // Tooltip
    const tooltipW = 100
    const tooltipH = 16 + config.scenarios.length * 16
    const tx = min(hx + 12, width - tooltipW - 10)
    const ty = margin.top + 10
    noStroke()
    fill(...CADENCE.bgCard, 92)
    rect(tx, ty, tooltipW, tooltipH, 3)

    fill(...CADENCE.text)
    textSize(12)
    textFont(CADENCE.font, CADENCE.fontFallback)
    textAlign(LEFT, CENTER)
    text(hoverYear, tx + 8, ty + 10)

    for (let s = 0; s < config.scenarios.length; s++) {
      const sc = config.scenarios[s]
      const trajs = data.scenarios[sc.key]
      const vals = trajs.map(t => t[yearIdx]).sort((a, b) => a - b)
      const med = vals[floor(vals.length / 2)]
      fill(sc.color[0], sc.color[1], sc.color[2])
      textSize(12)
      text(sc.key + ' ' + med.toFixed(1), tx + 8, ty + 10 + (s + 1) * 16)
    }
  }

  // Hint
  if (progression >= data.years.length - 1) {
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
