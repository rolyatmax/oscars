import palettes from './data/color-palettes-filtered.json'
// import palettes from './data/color-palettes.json'
import Color from 'color'

const container = document.querySelector('.container')

const films = Object.keys(palettes)

const filmEls = films.map(film => {
  const filmEl = document.createElement('div')
  filmEl.classList.add('film')
  filmEl.innerHTML = `<h2>${film}</h2>`

  const screenshots = palettes[film]

  const size = 450
  const padding = size * 0.05 | 0
  const canvas = createCanvas(size, size, padding)
  filmEl.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const center = [size / 2 | 0, size / 2 | 0]
  const maxMagnitude = (size / 2 | 0) - padding

  // draw all connections first
  screenshots.forEach(screenshot => {
    const screenshotCenter = getCenter(screenshot, maxMagnitude, center)
    screenshot.forEach(color => {
      const start = getCoordForColor(color, maxMagnitude, center)
      drawLine(ctx, start, screenshotCenter, '#efefef')
      drawCircle(ctx, screenshotCenter, 2, '#ccc')
    })
  })

  // draw colored circles on top of the connections
  screenshots.forEach(screenshot => {
    screenshot.forEach(color => {
      plotColor(ctx, color, center, maxMagnitude)
    })
  })

  const screenshotsContainer = document.createElement('div')
  screenshotsContainer.classList.add('screenshots')
  const screenshotDivs = screenshots.map(colors => {
    const ul = document.createElement('ul')
    colors.forEach(color => {
      const li = document.createElement('li')
      li.style.backgroundColor = `rgb(${color.join(',')})`
      ul.appendChild(li)
    })
    return ul
  })
  screenshotDivs.forEach(div => screenshotsContainer.appendChild(div))
  filmEl.appendChild(screenshotsContainer)
  return filmEl
})

filmEls.forEach(filmEl => container.appendChild(filmEl))

function createCanvas (width, height, padding) {
  const canvas = document.createElement('canvas')
  canvas.height = height
  canvas.width = width
  canvas.style.height = `${height}px`
  canvas.style.width = `${width}px`
  return canvas
}

function getCenter (colors, wheelSize, center) {
  const positions = colors.map(color => getCoordForColor(color, wheelSize, center))
  const totals = positions.reduce((totals, [x, y]) => [totals[0] + x, totals[1] + y], [0, 0])
  return totals.map(coord => coord / positions.length)
}

function getCoordForColor (color, wheelSize, center) {
  color = Color.rgb(color)
  const [hue, , luminocity] = color.hsl().array()
  const rads = hue / 360 * Math.PI * 2
  const magnitude = wheelSize * (1 - (luminocity / 100))
  return [
    Math.cos(rads) * magnitude + center[0],
    Math.sin(rads) * magnitude + center[1]
  ]
}

function plotColor (ctx, color, center, wheelSize) {
  const position = getCoordForColor(color, wheelSize, center)
  color = Color.rgb(color)
  const [, saturation] = color.hsl().array()
  const circleSize = saturation / 100 * 10
  drawCircle(ctx, position, circleSize, color.toString())
}

function drawCircle (ctx, position, radius, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(position[0], position[1], radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawLine (ctx, start, end, color) {
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(start[0], start[1])
  ctx.lineTo(end[0], end[1])
  ctx.stroke()
}
