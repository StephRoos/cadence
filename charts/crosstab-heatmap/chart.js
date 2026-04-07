// chart.js — canevas crosstab-heatmap (D3 v7)
// Table de contingence entre deux variables catégorielles. Couleur par
// ratio conditionnel ligne (profil) pour rester lisible quand les marges
// sont déséquilibrées. Annotation dans chaque cellule : count + %.

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

const nRows = data.rows.length
const nCols = data.cols.length

// Longest label → marges dynamiques. Lignes à gauche, colonnes en haut (pivotées).
const longestRow = d3.max(data.rows, (r) => String(r).length) ?? 10
const longestCol = d3.max(data.cols, (c) => String(c).length) ?? 10
const leftPx = Math.min(180, Math.max(80, longestRow * 7 + 10))
const topPx = Math.min(160, Math.max(60, longestCol * 7 + 10))
const margin = { top: topPx, right: 40, bottom: 20, left: leftPx }

const plotW = config.canvas.maxWidth - margin.left - margin.right
const cellW = plotW / nCols
const cellH = Math.max(28, Math.min(cellW * 0.8, 60))
const plotH = cellH * nRows
const totalW = plotW + margin.left + margin.right
const totalH = plotH + margin.top + margin.bottom

const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${totalW} ${totalH}`)
  .style("background", config.colors.background)

// Titre
const subtitle = data.truncated
  ? `top ${nRows} × top ${nCols} · n = ${data.total.toLocaleString("fr")}`
  : `${nRows} × ${nCols} · n = ${data.total.toLocaleString("fr")}`

svg.append("text")
  .attr("x", margin.left).attr("y", 20)
  .attr("fill", config.colors.text).attr("font-size", 15).attr("font-weight", 600)
  .text(`${data.a} × ${data.b}`)

svg.append("text")
  .attr("x", margin.left).attr("y", 38)
  .attr("fill", config.colors.axis).attr("font-size", 11)
  .text(subtitle)

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

// Échelle : par défaut mode row_ratio (colorie selon profil de ligne), ∈ [0, 1].
// Alternative mode count : domaine max global, met en avant les grosses cellules.
const mode = config.overlays.mode || "row_ratio"
const maxCount = d3.max(data.counts.flat()) ?? 1
const scale = d3.scaleLinear()
  .domain(mode === "row_ratio" ? [0, 1] : [0, maxCount])
  .range([config.colors.low, config.colors.high])
  .interpolate(d3.interpolateRgb)

// Aplatir
const cells = []
for (let i = 0; i < nRows; i++) {
  for (let j = 0; j < nCols; j++) {
    cells.push({
      i, j,
      count: data.counts[i][j],
      ratio: data.row_ratios[i][j],
    })
  }
}

// Cellules
const rects = g.selectAll("rect.cell")
  .data(cells)
  .join("rect")
  .attr("class", "cell")
  .attr("x", (d) => d.j * cellW)
  .attr("y", (d) => d.i * cellH)
  .attr("width", cellW - 1)
  .attr("height", cellH - 1)
  .attr("fill", config.colors.low)
  .attr("opacity", 0)

rects.transition()
  .duration(config.animation.durationMs)
  .delay((d) => (d.i + d.j) * config.animation.stagger)
  .ease(d3.easeCubicOut)
  .attr("fill", (d) => scale(mode === "row_ratio" ? d.ratio : d.count))
  .attr("opacity", 1)

// Annotations : count (ligne haute) + % profil ligne (ligne basse).
const fmtPct = d3.format(`.${config.format.percentDecimals}%`)
const fmtInt = d3.format(",d")

function textFill(d) {
  // Contraste : seuil 0.55 — au-delà, texte sombre sur fond clair.
  const v = mode === "row_ratio" ? d.ratio : d.count / maxCount
  return v > 0.55 ? config.colors.background : config.colors.text
}

if (config.overlays.showCounts && cellH >= 30) {
  g.selectAll("text.count")
    .data(cells)
    .join("text")
    .attr("class", "count")
    .attr("x", (d) => d.j * cellW + cellW / 2)
    .attr("y", (d) => d.i * cellH + cellH / 2 - 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", Math.max(10, Math.min(13, cellH / 4)))
    .attr("font-family", "monospace")
    .attr("fill", textFill)
    .attr("opacity", 0)
    .text((d) => fmtInt(d.count).replace(/,/g, " "))
    .transition()
    .delay((d) => (d.i + d.j) * config.animation.stagger + config.animation.durationMs)
    .duration(200)
    .attr("opacity", 1)
}

if (config.overlays.showPercent && cellH >= 42) {
  g.selectAll("text.pct")
    .data(cells)
    .join("text")
    .attr("class", "pct")
    .attr("x", (d) => d.j * cellW + cellW / 2)
    .attr("y", (d) => d.i * cellH + cellH / 2 + 12)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 9)
    .attr("font-family", "monospace")
    .attr("fill", textFill)
    .attr("opacity", 0)
    .text((d) => fmtPct(d.ratio))
    .transition()
    .delay((d) => (d.i + d.j) * config.animation.stagger + config.animation.durationMs)
    .duration(200)
    .attr("opacity", 0.8)
}

// Labels lignes (gauche)
const MAX_LABEL = 22
const trunc = (s) => {
  const str = String(s)
  return str.length > MAX_LABEL ? str.slice(0, MAX_LABEL - 1) + "…" : str
}

svg.append("g")
  .selectAll("text.row-label")
  .data(data.rows)
  .join("text")
  .attr("class", "row-label")
  .attr("x", margin.left - 6)
  .attr("y", (_, i) => margin.top + i * cellH + cellH / 2)
  .attr("text-anchor", "end")
  .attr("dominant-baseline", "middle")
  .attr("fill", config.colors.text)
  .attr("font-size", 11)
  .text((v) => trunc(v))
  .append("title")
  .text((v) => String(v))

// Labels colonnes (haut, pivotés -45°)
svg.append("g")
  .selectAll("text.col-label")
  .data(data.cols)
  .join("text")
  .attr("class", "col-label")
  .attr("transform", (_, j) =>
    `translate(${margin.left + j * cellW + cellW / 2},${margin.top - 6}) rotate(-45)`,
  )
  .attr("text-anchor", "start")
  .attr("fill", config.colors.text)
  .attr("font-size", 11)
  .text((v) => trunc(v))

// Tooltip sur chaque cellule
rects.append("title")
  .text((d) =>
    `${data.rows[d.i]} × ${data.cols[d.j]}\n` +
    `count = ${fmtInt(d.count)}\n` +
    `ratio ligne = ${fmtPct(d.ratio)}`,
  )
