// chart.js — canevas bar-chart-categorical (D3 v7)
// Règle d'or Cadence : un canevas ne lit QUE data.json + config.json.
// Distribution d'une variable catégorielle : barres horizontales triées par
// fréquence, label à gauche, valeur + % à droite. Le bucket "Autres" (si
// présent) est teinté distinctement pour signaler qu'il agrège plusieurs
// modalités (convention : jamais fondu dans la série principale).

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// Mode embed : si ?embed=1, on attend les données via postMessage
// (envoyées par le parent qui intègre le canevas en iframe).
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

// Marges : left large pour les labels catégoriels, right pour count/%.
const margin = { top: 60, right: 120, bottom: 30, left: 160 }
const width = config.canvas.maxWidth - margin.left - margin.right

// Hauteur dynamique : 28px par barre + marges. On recalcule à partir du
// nombre de modalités pour ne pas écraser les barres quand il y en a peu
// ni les tasser quand il y en a beaucoup.
const BAR_HEIGHT = 22
const BAR_GAP = 8
const nBars = data.modalities.length
const plotHeight = nBars * (BAR_HEIGHT + BAR_GAP)
const totalHeight = plotHeight + margin.top + margin.bottom

const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${config.canvas.maxWidth} ${totalHeight}`)
  .style("background", config.colors.background)

// Formats
const sep = config.format.thousandsSeparator
const fmtInt = d3.format(",d")
const fmtN = (n) => fmtInt(n).replace(/,/g, sep)
const fmtPct = (r) => (r * 100).toFixed(config.format.percentDecimals) + "%"

// --- Titre + sous-titre ---
svg.append("text")
  .attr("x", margin.left).attr("y", 24)
  .attr("fill", config.colors.text).attr("font-size", 16).attr("font-weight", 600)
  .text(`${config.title} — ${data.column}`)

const subtitle = data.truncated
  ? `n = ${fmtN(data.total)} · ${data.unique_count} modalités distinctes (top ${nBars - 1} affichées)`
  : `n = ${fmtN(data.total)} · ${data.unique_count} modalités distinctes`

svg.append("text")
  .attr("x", margin.left).attr("y", 42)
  .attr("fill", config.colors.axis).attr("font-size", 11)
  .text(subtitle)

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

// X : 0 → count max. Les barres sont triées desc par le producteur, donc
// modalities[0].count est le max. On tolère quand même un fallback d3.max.
const vmax = d3.max(data.modalities, d => d.count) ?? 1
const x = d3.scaleLinear().domain([0, vmax]).range([0, width]).nice()

// Y : bande par modalité (index dans l'ordre fourni).
const y = d3.scaleBand()
  .domain(data.modalities.map((_, i) => i))
  .range([0, plotHeight])
  .paddingInner(BAR_GAP / (BAR_HEIGHT + BAR_GAP))

// --- Gridlines verticales (léger repère pour lire les counts) ---
g.append("g")
  .attr("class", "grid")
  .call(d3.axisBottom(x).ticks(5).tickSize(plotHeight).tickFormat(""))
  .attr("color", config.colors.grid)
  .attr("transform", `translate(0,0)`)
  .call(s => s.select(".domain").remove())

// --- Barres ---
const colorFor = (d) => d.is_other ? config.colors.other : config.colors.bar

const bars = g.selectAll("rect.bar")
  .data(data.modalities)
  .join("rect")
  .attr("class", "bar")
  .attr("x", 0)
  .attr("y", (_, i) => y(i))
  .attr("height", y.bandwidth())
  .attr("fill", colorFor)
  .attr("width", 0)   // point de départ pour l'animation

bars.transition()
  .duration(config.animation.durationMs)
  .delay((_, i) => i * config.animation.stagger)
  .ease(d3.easeCubicOut)
  .attr("width", d => x(d.count))

// --- Labels gauche : valeur de la modalité ---
// Tronquer les labels trop longs (ex : "South_Terminal_Extended") pour ne pas
// empiéter sur d'autres éléments SVG. tooltip donnera la valeur complète.
const MAX_LABEL = 22
const truncLabel = (s) => {
  const str = String(s)
  return str.length > MAX_LABEL ? str.slice(0, MAX_LABEL - 1) + "…" : str
}

g.selectAll("text.cat-label")
  .data(data.modalities)
  .join("text")
  .attr("class", "cat-label")
  .attr("x", -8)
  .attr("y", (_, i) => y(i) + y.bandwidth() / 2)
  .attr("text-anchor", "end")
  .attr("dominant-baseline", "middle")
  .attr("fill", d => d.is_other ? config.colors.axis : config.colors.text)
  .attr("font-size", 12)
  .attr("font-style", d => d.is_other ? "italic" : "normal")
  .text(d => truncLabel(d.value))
  .append("title")
  .text(d => d.is_other
    ? `Autres (${d.other_modalities} modalités)`
    : String(d.value))

// --- Labels droite : count + % ---
// Apparaissent après la fin de l'anim de chaque barre (stagger + duration).
g.selectAll("text.value-label")
  .data(data.modalities)
  .join("text")
  .attr("class", "value-label")
  .attr("x", d => x(d.count) + 6)
  .attr("y", (_, i) => y(i) + y.bandwidth() / 2)
  .attr("dominant-baseline", "middle")
  .attr("fill", config.colors.text)
  .attr("font-size", 11)
  .attr("font-family", "monospace")
  .attr("opacity", 0)
  .text(d => {
    const parts = []
    if (config.overlays.showCounts) parts.push(fmtN(d.count))
    if (config.overlays.showPercent) parts.push(`(${fmtPct(d.ratio)})`)
    return parts.join(" ")
  })
  .transition()
  .delay((_, i) => i * config.animation.stagger + config.animation.durationMs)
  .duration(200)
  .attr("opacity", 1)

// --- Hover : surbrillance ---
bars
  .on("mouseenter", function () {
    d3.select(this).attr("fill", config.colors.barHover)
  })
  .on("mouseleave", function (_, d) {
    d3.select(this).attr("fill", colorFor(d))
  })
  .append("title")
  .text(d => d.is_other
    ? `Autres (${d.other_modalities} modalités regroupées) — ${fmtN(d.count)} (${fmtPct(d.ratio)})`
    : `${d.value} — ${fmtN(d.count)} (${fmtPct(d.ratio)})`)
