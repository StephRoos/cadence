// chart.js — canevas boxplot-grouped (D3 v7)
// Règle d'or Cadence : un canevas ne lit QUE data.json + config.json.
// Boxplots horizontaux empilés : un par modalité du cat, axe X commun pour
// comparer les distributions d'une variable numérique. Convention Tukey :
// box = [Q1, Q3], moustaches aux valeurs adjacentes dans [Q1-1.5·IQR, Q3+1.5·IQR],
// outliers en points isolés.

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

const groups = data.groups
const nGroups = groups.length

// Marges : label modalité à gauche, count à droite, titre + axis haut/bas.
const margin = { top: 70, right: 80, bottom: 40, left: 160 }
const width = config.canvas.maxWidth - margin.left - margin.right
const rowH = config.canvas.rowHeight
const plotH = nGroups * rowH
const totalH = plotH + margin.top + margin.bottom

const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${config.canvas.maxWidth} ${totalH}`)
  .style("background", config.colors.background)

const fmt = d3.format(`.${config.format.decimals}f`)
const fmtInt = d3.format(",d")

// Titre + sous-titre
svg.append("text")
  .attr("x", margin.left).attr("y", 24)
  .attr("fill", config.colors.text).attr("font-size", 16).attr("font-weight", 600)
  .text(`${data.num} par ${data.cat}`)

const subtitle = data.truncated
  ? `${nGroups} modalités affichées sur ${data.total_modalities}`
  : `${nGroups} modalités`

svg.append("text")
  .attr("x", margin.left).attr("y", 42)
  .attr("fill", config.colors.axis).attr("font-size", 11)
  .text(subtitle)

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

// Domaine X : min des whisker_low et outliers bas → max des whisker_high et outliers hauts.
const allVals = []
for (const gr of groups) {
  allVals.push(gr.whisker_low, gr.whisker_high)
  if (gr.outliers) allVals.push(...gr.outliers)
}
const x = d3.scaleLinear()
  .domain(d3.extent(allVals))
  .range([0, width])
  .nice()

// Y : bande par groupe (index).
const y = d3.scaleBand()
  .domain(groups.map((_, i) => i))
  .range([0, plotH])
  .paddingInner(0.3)

// Gridlines verticales
g.append("g")
  .attr("class", "grid")
  .call(d3.axisBottom(x).ticks(6).tickSize(plotH).tickFormat(""))
  .attr("color", config.colors.grid)
  .call((s) => s.select(".domain").remove())

// Axe X bas
g.append("g")
  .attr("transform", `translate(0,${plotH})`)
  .call(d3.axisBottom(x).ticks(6).tickFormat((d) => fmt(d)))
  .attr("color", config.colors.axis)
  .attr("font-size", 10)

// Labels modalités (gauche)
const MAX_LABEL = 22
const truncLabel = (s) => {
  const str = String(s)
  return str.length > MAX_LABEL ? str.slice(0, MAX_LABEL - 1) + "…" : str
}

g.selectAll("text.mod-label")
  .data(groups)
  .join("text")
  .attr("class", "mod-label")
  .attr("x", -8)
  .attr("y", (_, i) => y(i) + y.bandwidth() / 2)
  .attr("text-anchor", "end")
  .attr("dominant-baseline", "middle")
  .attr("fill", config.colors.text)
  .attr("font-size", 12)
  .text((d) => truncLabel(d.modality))
  .append("title")
  .text((d) => String(d.modality))

// Count à droite
g.selectAll("text.count")
  .data(groups)
  .join("text")
  .attr("class", "count")
  .attr("x", width + 8)
  .attr("y", (_, i) => y(i) + y.bandwidth() / 2)
  .attr("dominant-baseline", "middle")
  .attr("fill", config.colors.axis)
  .attr("font-size", 10)
  .attr("font-family", "monospace")
  .text((d) => `n=${fmtInt(d.count)}`)

// --- Boxplots ---
// Un groupe SVG par boîte, permet de regrouper les transitions.
const bw = y.bandwidth()
const duration = config.animation.durationMs

groups.forEach((gr, i) => {
  const cy = y(i) + bw / 2
  const box = g.append("g").attr("class", `box-${i}`)

  // Moustaches : ligne horizontale whisker_low → whisker_high.
  box.append("line")
    .attr("x1", x(gr.median)).attr("x2", x(gr.median))
    .attr("y1", cy).attr("y2", cy)
    .attr("stroke", config.colors.whisker).attr("stroke-width", 1)
    .transition().duration(duration).ease(d3.easeCubicOut)
    .attr("x1", x(gr.whisker_low))
    .attr("x2", x(gr.whisker_high))

  // Caps des moustaches
  const capH = bw * 0.3
  ;[gr.whisker_low, gr.whisker_high].forEach((v) => {
    box.append("line")
      .attr("x1", x(gr.median)).attr("x2", x(gr.median))
      .attr("y1", cy).attr("y2", cy)
      .attr("stroke", config.colors.whisker).attr("stroke-width", 1)
      .transition().duration(duration).ease(d3.easeCubicOut)
      .attr("x1", x(v)).attr("x2", x(v))
      .attr("y1", cy - capH / 2).attr("y2", cy + capH / 2)
  })

  // Boîte Q1 → Q3
  const boxH = bw * 0.7
  box.append("rect")
    .attr("x", x(gr.median)).attr("width", 0)
    .attr("y", cy - boxH / 2).attr("height", boxH)
    .attr("fill", config.colors.boxFill)
    .attr("stroke", config.colors.box).attr("stroke-width", 1.5)
    .transition().duration(duration).ease(d3.easeCubicOut)
    .attr("x", x(gr.q1))
    .attr("width", x(gr.q3) - x(gr.q1))

  // Ligne médiane
  box.append("line")
    .attr("x1", x(gr.median)).attr("x2", x(gr.median))
    .attr("y1", cy - boxH / 2).attr("y2", cy + boxH / 2)
    .attr("stroke", config.colors.median).attr("stroke-width", 2)

  // Outliers : points isolés, opacité progressive
  if (gr.outliers && gr.outliers.length > 0) {
    box.selectAll("circle.outlier")
      .data(gr.outliers)
      .join("circle")
      .attr("class", "outlier")
      .attr("cx", x(gr.median)).attr("cy", cy)
      .attr("r", 2.5)
      .attr("fill", config.colors.outlier)
      .attr("opacity", 0)
      .transition().duration(duration).ease(d3.easeCubicOut)
      .attr("cx", (v) => x(v))
      .attr("opacity", 0.7)
  }

  // Tooltip via <title> sur la box
  box.append("title")
    .text(
      `${gr.modality} (n=${fmtInt(gr.count)})\n` +
      `min=${fmt(gr.min)} · Q1=${fmt(gr.q1)} · med=${fmt(gr.median)} · Q3=${fmt(gr.q3)} · max=${fmt(gr.max)}\n` +
      `moy=${fmt(gr.mean)}`,
    )
})
