import palettes from './data/color-palettes.json'
import Color from 'color'
import {GUI} from 'dat-gui'

const thumbnailDir = 'data/thumbs'

const container = document.querySelector('.container')

const films = Object.keys(palettes)

const settings = {
  canvasSize: 450,
  showColorConnections: false,
  colorThreshold: 0.02,
  screenshotCircleSize: 2,
  colorCircleMaxSize: 15,
  magnitudeDimension: 'lightness',
  circleSizeDimensionNegative: false,
  circleSizeDimension: 'saturation',
  magnitudeDimensionNegative: true
}

const gui = new GUI()
gui.add(settings, 'canvasSize', 50, 1000).step(10).onChange(renderPage)
gui.add(settings, 'colorThreshold', 0, 1.0).step(0.01).onChange(renderPage)
gui.add(settings, 'screenshotCircleSize', 0, 10).step(1).onChange(renderPage)
gui.add(settings, 'colorCircleMaxSize', 1, 40).step(1).onChange(renderPage)
gui.add(settings, 'circleSizeDimension', ['lightness', 'saturation']).onChange(renderPage)
gui.add(settings, 'circleSizeDimensionNegative').onChange(renderPage)
gui.add(settings, 'magnitudeDimension', ['lightness', 'saturation']).onChange(renderPage)
gui.add(settings, 'magnitudeDimensionNegative').onChange(renderPage)
gui.add(settings, 'showColorConnections').onChange(renderPage)

renderPage()

function renderPage () {
  const { canvasSize } = settings
  container.innerHTML = ''
  const filmEls = films.map(film => {
    const filmEl = document.createElement('div')
    filmEl.style.width = `${canvasSize}px`
    filmEl.classList.add('film')
    filmEl.innerHTML = `<h2>${film}</h2>`

    const screenshots = palettes[film]
    const padding = canvasSize * 0.05 | 0
    const canvas = createCanvas(canvasSize, canvasSize, padding)
    filmEl.appendChild(canvas)
    const ctx = canvas.getContext('2d')

    renderViz(ctx, screenshots, padding)

    const screenshotsContainer = renderScreenshots(screenshots)
    filmEl.appendChild(screenshotsContainer)
    return filmEl
  })

  filmEls.forEach(filmEl => container.appendChild(filmEl))
}

function renderScreenshots (screenshots) {
  const screenshotsContainer = document.createElement('div')
  screenshotsContainer.classList.add('screenshots')
  screenshots.forEach(screenshot => {
    const colors = getColorsFromScreenshot(screenshot)
    const screenshotDiv = document.createElement('div')
    const img = document.createElement('img')
    img.src = `${thumbnailDir}/${screenshot.src}`
    const swatch = renderSwatch(colors)
    screenshotDiv.appendChild(swatch)
    screenshotDiv.appendChild(img)
    screenshotsContainer.appendChild(screenshotDiv)
  })
  return screenshotsContainer
}

function renderSwatch (colors) {
  const ul = document.createElement('ul')
  colors.forEach(color => {
    const li = document.createElement('li')
    li.style.backgroundColor = `rgb(${color.join(',')})`
    ul.appendChild(li)
  })
  return ul
}

function renderSwatches (screenshots) {
  const swatchesContainer = document.createElement('div')
  swatchesContainer.classList.add('swatches')
  const swatches = screenshots.map(screenshot => {
    const colors = getColorsFromScreenshot(screenshot)
    const ul = document.createElement('ul')
    colors.forEach(color => {
      const li = document.createElement('li')
      li.style.backgroundColor = `rgb(${color.join(',')})`
      ul.appendChild(li)
    })
    return ul
  })
  swatches.forEach(div => swatchesContainer.appendChild(div))
  return swatchesContainer
}

function renderViz (ctx, screenshots, padding) {
  const { height, width } = ctx.canvas
  const center = [width / 2 | 0, height / 2 | 0]
  const maxMagnitude = (Math.min(height, width) / 2 | 0) - padding

  if (settings.showColorConnections) {
    // draw all connections first
    screenshots.forEach(screenshot => {
      const colors = getColorsFromScreenshot(screenshot)
      const screenshotCenter = getCenter(colors, maxMagnitude, center)
      colors.forEach(color => {
        const start = getCoordForColor(color, maxMagnitude, center)
        drawLine(ctx, start, screenshotCenter, '#efefef')
        drawCircle(ctx, screenshotCenter, settings.screenshotCircleSize, '#ccc')
      })
    })
  }

  // draw colored circles on top of the connections
  screenshots.forEach(screenshot => {
    const colors = getColorsFromScreenshot(screenshot)
    colors.forEach(color => {
      plotColor(ctx, color, center, maxMagnitude)
    })
  })
}

function getColorsFromScreenshot (screenshot) {
  const threshold = settings.colorThreshold
  return screenshot.colors
    .filter(({ amount }) => threshold ? amount >= threshold : true)
    .map(({ color }) => color)
}

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
  const [hue, saturation, lightness] = color.hsl().array()
  const dimensions = { saturation, lightness }
  const magnitudeDimension = dimensions[settings.magnitudeDimension]
  const rads = hue / 360 * Math.PI * 2
  const magnitudePerc = magnitudeDimension / 100
  const scale = settings.magnitudeDimensionNegative ? (1 - magnitudePerc) : magnitudePerc
  const magnitude = wheelSize * scale
  return [
    Math.cos(rads) * magnitude + center[0],
    Math.sin(rads) * magnitude + center[1]
  ]
}

function plotColor (ctx, color, center, wheelSize) {
  const position = getCoordForColor(color, wheelSize, center)
  color = Color.rgb(color)
  const [, saturation, lightness] = color.hsl().array()
  const dimensions = { saturation, lightness }
  const dimension = dimensions[settings.circleSizeDimension]
  const sizePerc = dimension / 100
  const scale = settings.circleSizeDimensionNegative ? (1 - sizePerc) : sizePerc
  const circleSize = scale * settings.colorCircleMaxSize
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
