// chart.js — canevas histogram (D3 v7)
// Règle d'or Cadence : un canevas ne lit QUE data.json + config.json.
// Aucune donnée en dur, aucune logique métier.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// Mode embed : si l'URL contient ?embed=1, on attend les données via postMessage
// (envoyées par le parent qui intègre le canevas en iframe). Sinon mode standalone :
// on charge data.example.json + config.example.json depuis le dossier.
const params = new URLSearchParams(location.search)
const isEmbed = params.get("embed") === "1"

async function loadData() {
  if (!isEmbed) {
    return Promise.all([
      d3.json("./data.example.json"),
      d3.json("./config.example.json"),
    ])
  }
  // Embed : on signale qu'on est prêt, puis on attend le premier message {data, config}.
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

// Marges : top élargi pour titre, bottom pour label X, left pour label Y.
const margin = { top: 60, right: 20, bottom: 70, left: 75 }
const width = config.canvas.maxWidth - margin.left - margin.right
const height = config.canvas.height - margin.top - margin.bottom

// Boxplot horizontal optionnel sous l'histogramme. Partage le même axe X
// pour qu'on lise quartiles et distribution alignés visuellement (Tufte).
const hasBoxplot =
  config.overlays.showBoxplot &&
  data.stats.q1 != null &&
  data.stats.q3 != null
const BOX_BAND_HEIGHT = hasBoxplot ? 30 : 0
const BOX_GAP = hasBoxplot ? 10 : 0
// histHeight = zone réservée aux barres (le boxplot prend le bas).
const histHeight = height - BOX_BAND_HEIGHT - BOX_GAP

const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${config.canvas.maxWidth} ${config.canvas.height}`)
  .style("background", config.colors.background)

// Helper de format : "42 736" (séparateur de milliers depuis config).
const sep = config.format.thousandsSeparator
const fmtInt = d3.format(",d")
const fmtN = (n) => fmtInt(n).replace(/,/g, sep)
const fmtVal = (v) => v.toFixed(config.format.valueDecimals)

// --- Titre + sous-titre (au-dessus de la zone de dessin) ---
svg.append("text")
  .attr("x", margin.left).attr("y", 24)
  .attr("fill", config.colors.text).attr("font-size", 16).attr("font-weight", 600)
  .text(`${config.title} — ${data.column}`)

svg.append("text")
  .attr("x", margin.left).attr("y", 42)
  .attr("fill", config.colors.axis).attr("font-size", 11)
  .text(`n = ${fmtN(data.stats.count)} observations`)

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

// X : domaine = bornes réelles des bins ; range = pixels.
const x = d3.scaleLinear()
  .domain([data.bins[0].x0, data.bins[data.bins.length - 1].x1])
  .range([0, width])

// Y : domaine = 0 → count max ; range INVERSÉ car y=0 est en haut en SVG.
// Range borné à histHeight (pas height) pour laisser la place au boxplot.
const y = d3.scaleLinear()
  .domain([0, d3.max(data.bins, d => d.count)])
  .nice()
  .range([histHeight, 0])

// --- Gridlines horizontales (limitées à la zone des barres) ---
g.append("g")
  .attr("class", "grid")
  .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(""))
  .attr("color", config.colors.grid)
  .call(s => s.select(".domain").remove())   // pas de ligne verticale en plus

// --- Barres (data join + transition) ---
const bars = g.selectAll("rect.bar")
  .data(data.bins)
  .join("rect")
  .attr("class", "bar")
  .attr("x", d => x(d.x0))
  .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))   // 1px gap = continuité histogramme
  .attr("fill", config.colors.bar)
  .attr("y", histHeight).attr("height", 0)

bars.transition()
  .duration(config.animation.durationMs)
  .delay((d, i) => i * config.animation.stagger)
  .ease(d3.easeCubicOut)
  .attr("y", d => y(d.count))
  .attr("height", d => histHeight - y(d.count))

// --- Hover : surbrillance + tooltip ---
const tooltip = svg.append("g").style("pointer-events", "none").style("opacity", 0)
const tooltipBg = tooltip.append("rect")
  .attr("fill", config.colors.background).attr("stroke", config.colors.axis)
  .attr("rx", 4).attr("opacity", 0.95)
const tooltipText = tooltip.append("text")
  .attr("fill", config.colors.text).attr("font-size", 11)

bars
  .on("mouseenter", function (event, d) {
    d3.select(this).attr("fill", config.colors.barHover)
    const pct = ((d.count / data.stats.count) * 100).toFixed(1)
    const lines = [
      `[${fmtVal(d.x0)} ; ${fmtVal(d.x1)}[`,
      `${fmtN(d.count)} obs (${pct}%)`,
    ]
    tooltipText.selectAll("tspan").remove()
    lines.forEach((line, i) => {
      tooltipText.append("tspan")
        .attr("x", 8).attr("dy", i === 0 ? 14 : 14).text(line)
    })
    const bbox = tooltipText.node().getBBox()
    const tw = bbox.width + 16, th = bbox.height + 10
    tooltipBg.attr("width", tw).attr("height", th)
    // Centre du bin en coords SVG, puis clamp pour ne pas déborder du canvas.
    const px = margin.left + x(d.x0) + (x(d.x1) - x(d.x0)) / 2
    const tx = Math.max(4, Math.min(config.canvas.maxWidth - tw - 4, px - tw / 2))
    // Place au-dessus de la barre ; si pas la place, place en dessous.
    const barTop = margin.top + y(d.count)
    const ty = barTop - th - 6 < 4 ? barTop + 6 : barTop - th - 6
    tooltip.attr("transform", `translate(${tx}, ${ty})`)
    tooltip.style("opacity", 1)
  })
  .on("mouseleave", function () {
    d3.select(this).attr("fill", config.colors.bar)
    tooltip.style("opacity", 0)
  })

// --- Axes avec labels ---
g.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).ticks(8))
  .attr("color", config.colors.axis)

g.append("g")
  .call(d3.axisLeft(y).ticks(6).tickFormat(d => fmtN(d)))
  .attr("color", config.colors.axis)

// Label axe X (centré sous l'axe).
svg.append("text")
  .attr("x", margin.left + width / 2).attr("y", config.canvas.height - 18)
  .attr("text-anchor", "middle").attr("fill", config.colors.text).attr("font-size", 12)
  .text(data.column)

// Label axe Y (vertical, à gauche).
svg.append("text")
  .attr("transform", `rotate(-90)`)
  .attr("x", -(margin.top + height / 2)).attr("y", 18)
  .attr("text-anchor", "middle").attr("fill", config.colors.text).attr("font-size", 12)
  .text("nombre d'observations")

// --- Helper overlay : ligne verticale + label avec halo ---
function drawVLine(value, color, label, dash, labelY) {
  if (value == null) return
  const px = x(value)
  // Lignes limitées à la zone des barres uniquement (n'envahissent pas le boxplot).
  g.append("line")
    .attr("x1", px).attr("x2", px).attr("y1", 0).attr("y2", histHeight)
    .attr("stroke", config.colors.background).attr("stroke-width", 4)
  g.append("line")
    .attr("x1", px).attr("x2", px).attr("y1", 0).attr("y2", histHeight)
    .attr("stroke", color).attr("stroke-width", 2).attr("stroke-dasharray", dash)
  // Si la ligne est dans le tiers droit, place le label à gauche pour ne pas déborder.
  const onRight = px > width * 0.66
  g.append("text")
    .attr("x", onRight ? px - 4 : px + 4).attr("y", labelY)
    .attr("text-anchor", onRight ? "end" : "start")
    .attr("fill", color).attr("font-size", 11)
    .attr("stroke", config.colors.background).attr("stroke-width", 3)
    .attr("paint-order", "stroke")
    .text(label)
}

// Mean : pointillés courts ; médiane : pointillés longs (forme + couleur).
if (config.overlays.showMean)
  drawVLine(data.stats.mean, config.colors.mean, `moy. ${fmtVal(data.stats.mean)}`, "4 3", 12)
if (config.overlays.showMedian)
  drawVLine(data.stats.median, config.colors.median, `méd. ${fmtVal(data.stats.median)}`, "8 4", 26)

// --- Boxplot horizontal (sous l'histogramme, axe X partagé) ---
if (hasBoxplot) {
  const cy = histHeight + BOX_GAP + BOX_BAND_HEIGHT / 2
  const boxH = BOX_BAND_HEIGHT * 0.7
  const top = cy - boxH / 2
  const xMin = x(data.stats.min), xMax = x(data.stats.max)
  const xQ1 = x(data.stats.q1), xQ3 = x(data.stats.q3)
  const xMed = x(data.stats.median)

  const box = g.append("g").attr("class", "boxplot")

  // Moustache horizontale (min → max), passe derrière la boîte.
  box.append("line")
    .attr("x1", xMin).attr("x2", xMax).attr("y1", cy).attr("y2", cy)
    .attr("stroke", config.colors.axis).attr("stroke-width", 1)

  // Caps verticaux aux extrémités min et max.
  for (const px of [xMin, xMax]) {
    box.append("line")
      .attr("x1", px).attr("x2", px)
      .attr("y1", cy - boxH / 3).attr("y2", cy + boxH / 3)
      .attr("stroke", config.colors.axis).attr("stroke-width", 1)
  }

  // Boîte Q1-Q3 (l'IQR).
  box.append("rect")
    .attr("x", xQ1).attr("y", top)
    .attr("width", Math.max(1, xQ3 - xQ1)).attr("height", boxH)
    .attr("fill", config.colors.bar).attr("opacity", 0.6)
    .attr("stroke", config.colors.axis).attr("stroke-width", 1)

  // Ligne médiane à l'intérieur de la boîte.
  box.append("line")
    .attr("x1", xMed).attr("x2", xMed).attr("y1", top).attr("y2", top + boxH)
    .attr("stroke", config.colors.median).attr("stroke-width", 2)

  // Moyenne : losange (convention R/matplotlib/seaborn) au centre vertical.
  if (data.stats.mean != null) {
    const xMean = x(data.stats.mean)
    const r = boxH / 3
    box.append("path")
      .attr("d", `M ${xMean} ${cy - r} L ${xMean + r} ${cy} L ${xMean} ${cy + r} L ${xMean - r} ${cy} Z`)
      .attr("fill", config.colors.mean)
      .attr("stroke", config.colors.background).attr("stroke-width", 1)
  }
}

// --- Stats box (coin haut-droit) ---
if (config.overlays.showStatsBox) {
  const stats = [
    ["n", fmtN(data.stats.count)],
    ["min", fmtVal(data.stats.min)],
    ["max", fmtVal(data.stats.max)],
    ["moy.", fmtVal(data.stats.mean)],
    ["méd.", fmtVal(data.stats.median)],
  ]
  if (data.stats.q1 != null) stats.push(["Q1", fmtVal(data.stats.q1)])
  if (data.stats.q3 != null) stats.push(["Q3", fmtVal(data.stats.q3)])
  const boxW = 140, boxH = 16 + stats.length * 14
  const box = svg.append("g")
    .attr("transform", `translate(${config.canvas.maxWidth - boxW - margin.right}, ${margin.top + 8})`)
  box.append("rect")
    .attr("width", boxW).attr("height", boxH).attr("rx", 4)
    .attr("fill", config.colors.background).attr("stroke", config.colors.grid)
  stats.forEach(([k, v], i) => {
    box.append("text")
      .attr("x", 10).attr("y", 16 + i * 14)
      .attr("fill", config.colors.axis).attr("font-size", 10).text(k)
    box.append("text")
      .attr("x", boxW - 10).attr("y", 16 + i * 14).attr("text-anchor", "end")
      .attr("fill", config.colors.text).attr("font-size", 10).attr("font-family", "monospace")
      .text(v)
  })
}
