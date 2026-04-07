// chart.js — canevas correlation-heatmap (D3 v7)
// Règle d'or Cadence : un canevas ne lit QUE data.json + config.json.
// Matrice d'association mixte (num + cat). Chaque cellule contient :
//   { strength: [0,1], signed: [-1,1] | null, method: string }
// Le rendu utilise la force d'association sur [0, 1] avec une échelle
// mono-ambre (sombre → clair). Le signe et la méthode apparaissent dans
// le tooltip pour ne pas surcharger la lecture visuelle.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

const params = new URLSearchParams(location.search)
const isEmbed = params.get("embed") === "1"

async function loadData() {
  if (!isEmbed) {
    return Promise.all([
      d3.json("./data.example.json"),
      d3.json("./config.example.json"),
    ])
  }
  return new Promise((resolve) => {
    window.addEventListener("message", function handler(e) {
      if (!e.data || !e.data.data || !e.data.config) return
      window.removeEventListener("message", handler)
      resolve([e.data.data, e.data.config])
    })
    parent.postMessage({ type: "cadence:ready" }, "*")
  })
}

const [data, config] = await loadData()

const n = data.columns.length
const types = data.types || data.columns.map(() => "num")

// Marges : labels à gauche et en haut (pivotés). Dimensionnées par la
// longueur max des noms pour éviter toute troncature.
const longestLabel = d3.max(data.columns, (c) => c.length) ?? 10
const labelPx = Math.min(160, Math.max(60, longestLabel * 7 + 10))
const margin = { top: labelPx, right: 40, bottom: 20, left: labelPx }

// Cellules : remplir toute la largeur disponible (plus de cap).
const plotW = config.canvas.maxWidth - margin.left - margin.right
const cell = plotW / n
const plotSize = cell * n
const totalW = plotSize + margin.left + margin.right
const totalH = plotSize + margin.top + margin.bottom

const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${totalW} ${totalH}`)
  .style("background", config.colors.background)

// Titre
svg.append("text")
  .attr("x", margin.left).attr("y", 20)
  .attr("fill", config.colors.text).attr("font-size", 15).attr("font-weight", 600)
  .text(`${config.title} — ${data.method === "spearman" ? "Spearman" : "Pearson"} + Cramér · η`)

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

// Trois familles de couleur selon le type de paire : convention Prisme
// alignée sur le reste de l'app (ambre num, bleu-clair cat, vert num×cat).
// La saturation est indexée sur la force [0, 1].
const pairHues = {
  "num-num": config.colors.numNum || config.colors.pos,       // ambre
  "cat-cat": config.colors.catCat || config.colors.neg,       // bleu-clair
  "mixed":   config.colors.mixed  || "#B8E6A8",               // vert-sauge
}
const scales = {
  "num-num": d3.scaleLinear().domain([0, 1])
    .range([config.colors.neutral, pairHues["num-num"]]).interpolate(d3.interpolateRgb),
  "cat-cat": d3.scaleLinear().domain([0, 1])
    .range([config.colors.neutral, pairHues["cat-cat"]]).interpolate(d3.interpolateRgb),
  "mixed": d3.scaleLinear().domain([0, 1])
    .range([config.colors.neutral, pairHues["mixed"]]).interpolate(d3.interpolateRgb),
}

function pairType(i, j) {
  const ti = types[i], tj = types[j]
  if (ti === "num" && tj === "num") return "num-num"
  if (ti === "cat" && tj === "cat") return "cat-cat"
  return "mixed"
}

const DIM_OPACITY = 0.12

// Aplatir la matrice en excluant la diagonale (bruit visuel : η=1 triviaux).
const cells = []
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    if (i === j) continue
    cells.push({ i, j, pt: pairType(i, j), ...data.matrix[i][j] })
  }
}

const fmt = d3.format(`.${config.format.decimals}f`)

// Libellés des méthodes pour tooltip
const methodLabel = {
  diag: "diagonale",
  pearson: "Pearson (linéaire)",
  spearman: "Spearman (rang)",
  cramer: "Cramér's V",
  eta: "η (correlation ratio)",
}

function cellColor(d) {
  if (d.strength == null) return config.colors.neutral
  return scales[d.pt](d.strength)
}

function cellOpacity(d) {
  if (d.strength == null) return DIM_OPACITY
  return 1
}

// Cellules avec apparition en vague anti-diagonale.
const rects = g.selectAll("rect.cell")
  .data(cells)
  .join("rect")
  .attr("class", "cell")
  .attr("x", (d) => d.j * cell)
  .attr("y", (d) => d.i * cell)
  .attr("width", cell - 1)
  .attr("height", cell - 1)
  .attr("fill", config.colors.neutral)
  .attr("opacity", 0)

rects.transition()
  .duration(config.animation.durationMs)
  .delay((d) => (d.i + d.j) * config.animation.stagger)
  .ease(d3.easeCubicOut)
  .attr("fill", cellColor)
  .attr("opacity", cellOpacity)

// Valeurs : on affiche la force (et un signe ± si dispo pour num×num).
if (config.overlays.showValues && cell >= 32) {
  g.selectAll("text.val")
    .data(cells)
    .join("text")
    .attr("class", "val")
    .attr("x", (d) => d.j * cell + cell / 2)
    .attr("y", (d) => d.i * cell + cell / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", Math.max(10, Math.min(13, cell / 4.5)))
    .attr("font-family", "monospace")
    // Contraste : texte clair sur cellule sombre (force < 0.55).
    .attr("fill", (d) =>
      d.strength == null || d.strength < 0.55 ? config.colors.text : config.colors.background,
    )
    .attr("opacity", 0)
    .text((d) => {
      if (d.strength == null) return "—"
      const s = fmt(d.strength)
      if (d.signed != null && d.signed < 0) return `−${s}`
      return s
    })
    .transition()
    .delay((d) => (d.i + d.j) * config.animation.stagger + config.animation.durationMs)
    .duration(200)
    .attr("opacity", (d) => cellOpacity(d))
}

// Labels colonnes + lignes, colorés selon le type (num=amber, cat=bleu-clair).
const typeColor = (t) => (t === "num" ? config.colors.pos : config.colors.neg)

svg.append("g")
  .selectAll("text.col-label")
  .data(data.columns)
  .join("text")
  .attr("class", "col-label")
  .attr("transform", (_, j) =>
    `translate(${margin.left + j * cell + cell / 2},${margin.top - 6}) rotate(-45)`,
  )
  .attr("text-anchor", "start")
  .attr("fill", (_, j) => typeColor(types[j]))
  .attr("font-size", 11)
  .text((c) => c)

svg.append("g")
  .selectAll("text.row-label")
  .data(data.columns)
  .join("text")
  .attr("class", "row-label")
  .attr("x", margin.left - 6)
  .attr("y", (_, i) => margin.top + i * cell + cell / 2)
  .attr("text-anchor", "end")
  .attr("dominant-baseline", "middle")
  .attr("fill", (_, i) => typeColor(types[i]))
  .attr("font-size", 11)
  .text((c) => c)

// Tooltip : nom × nom · méthode · force · signe
// Click → notifier le parent (sélection de paire pour analyse bivariée).
rects
  .style("cursor", "pointer")
  .on("click", (_, d) => {
    parent.postMessage(
      {
        type: "cadence:pair-click",
        a: data.columns[d.i],
        b: data.columns[d.j],
        typeA: types[d.i],
        typeB: types[d.j],
      },
      "*",
    )
  })

rects.append("title")
  .text((d) => {
    if (d.strength == null) return `${data.columns[d.i]} × ${data.columns[d.j]} : non calculable`
    const m = methodLabel[d.method] || d.method
    const s = fmt(d.strength)
    const signLabel =
      d.signed == null
        ? ""
        : d.signed >= 0
          ? `  ·  signe : +`
          : `  ·  signe : −`
    return `${data.columns[d.i]} × ${data.columns[d.j]}\n${m}  ·  force = ${s}${signLabel}`
  })
