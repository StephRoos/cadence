// chart.js — canevas scatter-xy (D3 v7)
// Nuage de points num × num avec régression OLS (calculée côté producteur)
// et coloration optionnelle par variable catégorielle (hue). L'hue est déjà
// capé côté backend au top 6 modalités + "Autres" → la palette suit.

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

const margin = { top: 60, right: 40, bottom: 50, left: 70 }
const width = config.canvas.maxWidth - margin.left - margin.right
const height = config.canvas.height - margin.top - margin.bottom

const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${config.canvas.maxWidth} ${config.canvas.height}`)
  .style("background", config.colors.background)

// Titre
svg.append("text")
  .attr("x", margin.left).attr("y", 24)
  .attr("fill", config.colors.text).attr("font-size", 15).attr("font-weight", 600)
  .text(`${data.y} vs ${data.x}`)

const subtitleParts = [`n = ${data.total.toLocaleString("fr")}`]
if (data.sampled < data.total) subtitleParts.push(`échantillon ${data.sampled.toLocaleString("fr")}`)
if (data.hue) subtitleParts.push(`coloré par ${data.hue}`)
svg.append("text")
  .attr("x", margin.left).attr("y", 42)
  .attr("fill", config.colors.axis).attr("font-size", 11)
  .text(subtitleParts.join(" · "))

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

// Échelles
const xExt = d3.extent(data.points, (p) => p.x)
const yExt = d3.extent(data.points, (p) => p.y)
const x = d3.scaleLinear().domain(xExt).nice().range([0, width])
const y = d3.scaleLinear().domain(yExt).nice().range([height, 0])

// Grille
g.append("g")
  .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(""))
  .attr("color", config.colors.grid)
  .call((s) => s.select(".domain").remove())

g.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).ticks(8).tickSize(-height).tickFormat(""))
  .attr("color", config.colors.grid)
  .call((s) => s.select(".domain").remove())

// Axes
g.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).ticks(8))
  .attr("color", config.colors.axis)
  .attr("font-size", 10)

g.append("g")
  .call(d3.axisLeft(y).ticks(6))
  .attr("color", config.colors.axis)
  .attr("font-size", 10)

// Labels d'axes
g.append("text")
  .attr("x", width / 2).attr("y", height + 38)
  .attr("text-anchor", "middle").attr("fill", config.colors.axis).attr("font-size", 11)
  .text(data.x)

g.append("text")
  .attr("transform", `rotate(-90)`)
  .attr("x", -height / 2).attr("y", -50)
  .attr("text-anchor", "middle").attr("fill", config.colors.axis).attr("font-size", 11)
  .text(data.y)

// Palette : une couleur par groupe, fallback "single" si pas de hue.
const groups = data.groups && data.groups.length > 0 ? data.groups : ["all"]
const hasHue = !!data.hue && groups.length > 1
const color = d3.scaleOrdinal()
  .domain([...groups, "Autres"])
  .range(hasHue ? config.colors.palette : [config.colors.single])

// Points
const pts = g.selectAll("circle.pt")
  .data(data.points)
  .join("circle")
  .attr("class", "pt")
  .attr("cx", (p) => x(p.x))
  .attr("cy", (p) => y(p.y))
  .attr("r", 0)
  .attr("fill", (p) => color(p.group))
  .attr("opacity", 0)

pts.transition()
  .duration(config.animation.durationMs)
  .ease(d3.easeCubicOut)
  .attr("r", config.pointRadius)
  .attr("opacity", config.pointAlpha)

// Régression OLS globale
if (config.overlays.showRegression && data.regression) {
  const { slope, intercept } = data.regression
  const x1 = xExt[0], x2 = xExt[1]
  const y1 = slope * x1 + intercept
  const y2 = slope * x2 + intercept
  g.append("line")
    .attr("x1", x(x1)).attr("y1", y(y1))
    .attr("x2", x(x1)).attr("y2", y(y1))
    .attr("stroke", config.colors.regression).attr("stroke-width", 2)
    .transition().duration(config.animation.durationMs * 1.5).ease(d3.easeCubicOut)
    .attr("x2", x(x2)).attr("y2", y(y2))
}

// R² en haut à droite
if (config.overlays.showR2 && data.regression) {
  g.append("text")
    .attr("x", width - 4).attr("y", 14)
    .attr("text-anchor", "end")
    .attr("fill", config.colors.regression)
    .attr("font-size", 11)
    .attr("font-family", "monospace")
    .text(`R² = ${data.regression.r2.toFixed(3)}`)
}

// Légende hue (top à droite, sous R²)
if (hasHue) {
  const legend = svg.append("g")
    .attr("transform", `translate(${config.canvas.maxWidth - margin.right - 10}, ${margin.top + 26})`)
  groups.forEach((gname, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 14})`)
    row.append("circle").attr("r", 4).attr("cx", -6).attr("fill", color(gname))
    row.append("text").attr("x", 2).attr("y", 3)
      .attr("text-anchor", "start")
      .attr("fill", config.colors.text).attr("font-size", 10)
      .text(gname)
  })
}
