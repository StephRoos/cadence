// Couleurs Anthemion en HSL pour CSS (D3 utilise CSS, pas HSB comme p5)
const CADENCE_CSS = {
  bg:        '#1e1e2e',
  bgCard:    '#262637',
  text:      '#E0F4F8',
  textMuted: '#94A3B8',
  textSubtle:'#64748B',
  gridLine:  '#313244',
  axisLabel: '#64748B',
}

// Convertir HSB [h, s%, b%] → CSS hsl string
function hsbToHsl(h, s, b) {
  s /= 100; b /= 100
  const l = b * (1 - s / 2)
  const sl = l === 0 || l === 1 ? 0 : (b - l) / Math.min(l, 1 - l)
  return `hsl(${h}, ${Math.round(sl * 100)}%, ${Math.round(l * 100)}%)`
}

// Régression linéaire — moindres carrés ordinaires
// Retourne { slope, intercept } pour y = slope * x + intercept
function linearRegression(points) {
  const n = points.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (const p of points) {
    sumX  += p.x
    sumY  += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
  }
  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}


// Charger config d'abord, puis data via le chemin dans config
d3.json('config.example.json').then(config => {
  d3.json(config.dataPath).then(data => {
    buildChart(data, config)
  })
})

function buildChart(data, config) {
  const width  = Math.min(window.innerWidth - 20, config.canvas.maxWidth)
  const height = config.canvas.height
  const m = config.margin
  const innerW = width - m.left - m.right
  const innerH = height - m.top - m.bottom

  // SVG container avec accessibilité
  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('role', 'img')
    .attr('aria-label', `${config.title}. ${config.subtitle}`)
    .style('shape-rendering', 'geometricPrecision')

  // Titre
  svg.append('text')
    .attr('x', m.left).attr('y', 28)
    .attr('fill', CADENCE_CSS.text)
    .attr('font-size', 14)
    .text(config.title)

  // Sous-titre
  svg.append('text')
    .attr('x', m.left).attr('y', 46)
    .attr('fill', CADENCE_CSS.textMuted)
    .attr('font-size', 12)
    .text(config.subtitle)

  // Groupe principal
  const g = svg.append('g')
    .attr('transform', `translate(${m.left},${m.top})`)

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data.points, d => d.x))
    .range([0, innerW])
    .nice()

  const y = d3.scaleLinear()
    .domain(d3.extent(data.points, d => d.y))
    .range([innerH, 0])
    .nice()

  // Grille horizontale — derrière tout le reste
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(''))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line')
      .attr('stroke', CADENCE_CSS.gridLine)
      .attr('stroke-opacity', 0.4))

  // Axe X
  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(8))
    .call(g => g.select('.domain').attr('stroke', CADENCE_CSS.gridLine))
    .call(g => g.selectAll('.tick line').attr('stroke', CADENCE_CSS.gridLine))
    .call(g => g.selectAll('.tick text').attr('fill', CADENCE_CSS.axisLabel).attr('font-size', 12))

  // Label axe X
  g.append('text')
    .attr('x', innerW / 2).attr('y', innerH + 40)
    .attr('text-anchor', 'middle')
    .attr('fill', CADENCE_CSS.textMuted)
    .attr('font-size', 12)
    .text(config.xLabel)

  // Axe Y
  g.append('g')
    .call(d3.axisLeft(y).ticks(6))
    .call(g => g.select('.domain').attr('stroke', CADENCE_CSS.gridLine))
    .call(g => g.selectAll('.tick line').attr('stroke', CADENCE_CSS.gridLine))
    .call(g => g.selectAll('.tick text').attr('fill', CADENCE_CSS.axisLabel).attr('font-size', 12))

  // Label axe Y
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerH / 2).attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('fill', CADENCE_CSS.textMuted)
    .attr('font-size', 12)
    .text(config.yLabel)

  // Tooltip
  const tooltip = d3.select('body').append('div')
    .style('position', 'absolute')
    .style('background', CADENCE_CSS.bgCard)
    .style('color', CADENCE_CSS.text)
    .style('padding', '6px 10px')
    .style('border-radius', '3px')
    .style('font-size', '12px')
    .style('font-family', "'Geist Mono', monospace")
    .style('pointer-events', 'none')
    .style('opacity', 0)

  // Points — cercles colorés par groupe
  const groups = Object.keys(config.colors)

  g.selectAll('circle')
    .data(data.points)
    .join('circle')
    .attr('cx', d => x(d.x))
    .attr('cy', innerH)                            // départ en bas (animation)
    .attr('r', 0)
    .attr('fill', d => {
      const c = config.colors[d.group]
      return c ? hsbToHsl(c[0], c[1], c[2]) : CADENCE_CSS.textSubtle
    })
    .attr('opacity', config.pointAlpha)
    .on('mouseover', function (event, d) {
      d3.select(this)
        .attr('r', config.pointRadius * 2)
        .attr('opacity', 1)
      tooltip
        .style('opacity', 0.95)
        .html(`${d.group}<br>${config.xLabel}: ${d.x}<br>${config.yLabel}: ${d.y}`)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', function () {
      d3.select(this)
        .attr('r', config.pointRadius)
        .attr('opacity', config.pointAlpha)
      tooltip.style('opacity', 0)
    })
    // Animation d'entrée
    .transition()
    .duration(config.animation.duration)
    .delay((d, i) => i * config.animation.stagger)
    .attr('cy', d => y(d.y))
    .attr('r', config.pointRadius)

  // Lignes de régression — une par groupe, apparaissent après l'animation des points
  const totalAnimTime = config.animation.duration + data.points.length * config.animation.stagger
  const xDomain = x.domain()

  for (const group of groups) {
    const pts = data.points.filter(d => d.group === group)
    const reg = linearRegression(pts)
    const c = config.colors[group]
    const color = hsbToHsl(c[0], c[1], c[2])

    // Deux points de la droite aux bornes du domaine X
    const x1 = xDomain[0], x2 = xDomain[1]
    const y1 = reg.slope * x1 + reg.intercept
    const y2 = reg.slope * x2 + reg.intercept

    g.append('line')
      .attr('x1', x(x1)).attr('y1', y(y1))
      .attr('x2', x(x2)).attr('y2', y(y2))
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6 4')            // tirets — distinguer de la donnée
      .attr('opacity', 0)
      .transition()
      .delay(totalAnimTime)                        // apparaît après tous les points
      .duration(600)
      .attr('opacity', 0.8)
  }

  // Légende — forme + couleur + label par groupe
  const legend = svg.append('g')
    .attr('transform', `translate(${width - m.right - 130}, ${m.top})`)

  groups.forEach((group, i) => {
    const c = config.colors[group]
    const row = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`)
    row.append('rect')
      .attr('width', 10).attr('height', 10)
      .attr('rx', 5)
      .attr('fill', hsbToHsl(c[0], c[1], c[2]))
    row.append('text')
      .attr('x', 16).attr('y', 9)
      .attr('fill', CADENCE_CSS.textMuted)
      .attr('font-size', 12)
      .text(group)
  })
}
