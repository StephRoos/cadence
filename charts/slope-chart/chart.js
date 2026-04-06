let data       // données chargées depuis data.json
let config     // paramètres visuels depuis config.json

function preload() {
  data   = loadJSON('../../examples/carbon-witness/emissions-by-country.json')
  config = loadJSON('config.example.json')
}

function setup() {
  createCanvas(min(windowWidth - 20, config.canvas.maxWidth), config.canvas.height)
  colorMode(HSB, 360, 100, 100, 100)  // même espace couleur que animated-line
}

function windowResized() {
  resizeCanvas(min(windowWidth - 20, config.canvas.maxWidth), config.canvas.height)
}

// Marges — espace pour les labels à gauche et à droite
const margin = { top: 80, bottom: 40, left: 160, right: 160 }

// X : deux colonnes fixes (pas d'axe continu — c'est la différence clé avec un line chart)
function startX() { return margin.left }
function endX()   { return width - margin.right }

// Y : map linéaire valeur → pixel (inversé : grande valeur = haut = petit Y)
function valToY(val) {
  const yMin = margin.top
  const yMax = height - margin.bottom
  const vMax = max(data.points.map(p => max(p.start, p.end)))  // borne haute dynamique
  const vMin = 0                                                 // ancré à zéro
  return map(val, vMin, vMax, yMax, yMin)  // yMax en premier → inversion de l'axe
}

// Dodge simple — pousse uniquement vers le bas (greedy)
function dodgeSimple(positions, minGap) {
  const sorted = [...positions].sort((a, b) => a.y - b.y)
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].y - sorted[i - 1].y
    if (gap < minGap) {
      sorted[i].y = sorted[i - 1].y + minGap
    }
  }
  const result = new Array(positions.length)
  for (let i = 0; i < sorted.length; i++) result[sorted[i].index] = sorted[i].y
  return result
}

// Dodge bidirectionnel — répartit vers le haut ET le bas depuis le centre du conflit
// Préserve mieux la proximité label/point en étalant symétriquement
function dodgeBidi(positions, minGap) {
  const sorted = [...positions].sort((a, b) => a.y - b.y)

  // 1. Identifier les groupes de labels qui se chevauchent
  const groups = [[sorted[0]]]                              // au moins un groupe
  for (let i = 1; i < sorted.length; i++) {
    const last = groups[groups.length - 1]
    if (sorted[i].y - last[last.length - 1].y < minGap) {
      last.push(sorted[i])                                  // même groupe → conflit
    } else {
      groups.push([sorted[i]])                               // nouveau groupe isolé
    }
  }

  // 2. Pour chaque groupe, calculer le centre puis étaler symétriquement
  for (const group of groups) {
    if (group.length === 1) continue                         // pas de conflit
    const center = group.reduce((s, p) => s + p.y, 0) / group.length  // barycentre
    const totalHeight = (group.length - 1) * minGap          // hauteur totale nécessaire
    const topY = center - totalHeight / 2                     // début de l'étalement
    for (let i = 0; i < group.length; i++) {
      group[i].y = topY + i * minGap                          // répartition régulière
    }
  }

  const result = new Array(positions.length)
  for (const group of groups) {
    for (const p of group) result[p.index] = p.y
  }
  return result
}

// Sélection via config.dodge : "simple" ou "bidi"
function dodge(positions, minGap) {
  return config.dodge === 'simple'
    ? dodgeSimple(positions, minGap)
    : dodgeBidi(positions, minGap)
}

let progression = 0  // 0→1 : avancement global de l'animation
let paused = false

function draw() {
  background(240, 30, 10)  // fond sombre — même teinte que animated-line

  // Titre
  noStroke()
  fill(0, 0, 80)
  textFont('monospace')
  textSize(14)
  textAlign(LEFT, BASELINE)
  text(config.title, margin.left, 30)

  // Sous-titre (source)
  fill(0, 0, 40)
  textSize(10)
  text(config.subtitle, margin.left, 48)

  // En-têtes des deux colonnes — "2000" à gauche, "2023" à droite
  fill(0, 0, 60)
  textSize(12)
  textAlign(CENTER, BASELINE)
  text(config.startLabel, startX(), 68)
  text(config.endLabel, endX(), 68)

  // Lignes verticales de repère — très discrètes
  stroke(0, 0, 30, 25)
  strokeWeight(1)
  line(startX(), margin.top, startX(), height - margin.bottom)
  line(endX(), margin.top, endX(), height - margin.bottom)

  // Trier selon config.sortBy
  // "narrative" : hausses décroissantes puis baisses (tension → espoir)
  // "change"    : plus grand changement absolu d'abord
  // "start"     : plus grande valeur de départ d'abord
  // "data"      : ordre du JSON (aucun tri)
  const sorted = [...data.points].sort((a, b) => {
    const da = a.end - a.start
    const db = b.end - b.start
    switch (config.sortBy) {
      case 'narrative':
        if (da >= 0 && db >= 0) return db - da
        if (da < 0 && db < 0) return da - db
        return da >= 0 ? -1 : 1
      case 'change':
        return abs(db) - abs(da)              // plus grand changement absolu d'abord
      case 'start':
        return b.start - a.start              // plus gros émetteur 2000 d'abord
      default:
        return 0                              // "data" : ordre original
    }
  })

  // Pré-calculer les positions Y dodgées pour les labels
  const minGap = 16
  const leftPositions  = sorted.map((p, i) => ({ y: valToY(p.start), index: i }))
  const rightPositions = sorted.map((p, i) => ({ y: valToY(p.end),   index: i }))
  const leftY  = dodge(leftPositions, minGap)
  const rightY = dodge(rightPositions, minGap)

  // Avancer l'animation (sauf si en pause)
  if (!paused) progression = min(progression + config.animation.speed, 1)

  // Lignes — une par entité, avec stagger
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]

    // Progression locale : chaque ligne démarre avec un décalage (stagger)
    // Le stagger total occupe 50% du temps — les 50% restants = toutes les lignes se tracent
    const maxDelay = 0.5
    const delay = (i / sorted.length) * maxDelay             // réparti uniformément sur 0→0.5
    const t = constrain((progression - delay) / (1 - delay), 0, 1)  // 0→1 pour cette ligne
    if (t === 0) continue                                    // pas encore démarrée

    const isHighlight = config.highlight.includes(p.label)
    const y1 = valToY(p.start)
    const y2 = valToY(p.end)

    // Point intermédiaire — la ligne se trace de gauche à droite
    const currentX = lerp(startX(), endX(), t)               // lerp = interpolation linéaire
    const currentY = lerp(y1, y2, t)

    // Couleur : highlight → couleur vive, sinon → gris atténué
    if (isHighlight) {
      const idx = config.highlight.indexOf(p.label)
      const c = config.colors.highlight[idx]
      stroke(c[0], c[1], c[2])
      strokeWeight(3)
    } else {
      const c = config.colors.muted
      stroke(c[0], c[1], c[2])
      strokeWeight(1.5)
    }

    line(startX(), y1, currentX, currentY)

    // Points aux extrémités — apparaissent avec la ligne
    noStroke()
    fill(isHighlight ? config.colors.highlight[config.highlight.indexOf(p.label)] : config.colors.muted)
    ellipse(startX(), y1, 6)                   // point gauche — toujours visible
    if (t >= 1) ellipse(endX(), y2, 6)         // point droit — quand la ligne arrive

    // Label gauche — apparaît dès que la ligne démarre
    textSize(11)
    textAlign(RIGHT, CENTER)
    text(p.label + '  ' + p.start, startX() - 10, leftY[i])

    // Label droite — apparaît quand la ligne arrive à destination
    if (t >= 1) {
      textAlign(LEFT, CENTER)
      text(p.end + '  ' + p.label, endX() + 10, rightY[i])
    }
  }

  // Hover interactif — trouver la ligne la plus proche de la souris
  if (progression >= 1 && mouseX >= startX() && mouseX <= endX()
      && mouseY >= margin.top && mouseY <= height - margin.bottom) {

    // t position horizontale de la souris entre 0 (gauche) et 1 (droite)
    const mx = (mouseX - startX()) / (endX() - startX())
    let closest = -1
    let closestDist = Infinity

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i]
      const lineY = lerp(valToY(p.start), valToY(p.end), mx)  // Y de la ligne sous la souris
      const d = abs(mouseY - lineY)
      if (d < closestDist) { closestDist = d; closest = i }
    }

    if (closest >= 0 && closestDist < 20) {                    // seuil de 20px
      const p = sorted[closest]
      const lineY = lerp(valToY(p.start), valToY(p.end), mx)
      const delta = p.end - p.start
      const sign = delta >= 0 ? '+' : ''

      // Surbrillance de la ligne
      stroke(0, 0, 90, 40)
      strokeWeight(5)
      line(startX(), valToY(p.start), endX(), valToY(p.end))

      // Tooltip
      const tx = mouseX + 12
      const ty = lineY - 10
      noStroke()
      fill(240, 30, 8, 92)
      rect(tx, ty, 100, 36, 3)
      fill(0, 0, 95)
      textSize(11)
      textFont('monospace')
      textAlign(LEFT, CENTER)
      text(p.label, tx + 6, ty + 10)
      fill(0, 0, 65)
      textSize(10)
      text(sign + delta.toFixed(1) + ' ' + config.unit, tx + 6, ty + 25)
    }
  }

  // Hint de contrôle — apparaît quand l'animation est terminée
  if (progression >= 1) {
    fill(0, 0, 40, 50 + 20 * sin(frameCount * 0.04))
    noStroke()
    textSize(10)
    textAlign(CENTER, BASELINE)
    text('double-clic pour relancer · espace = pause', width / 2, height - 10)
  }
}

function doubleClicked() {
  progression = 0
  paused = false
}

function keyPressed() {
  if (key === ' ') {
    paused = !paused
    return false  // empêcher le scroll de la page
  }
}
