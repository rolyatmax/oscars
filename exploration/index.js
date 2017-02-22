import palettes from '../data/color-palettes.json'
import sortBy from 'lodash/sortBy'
import Color from 'color'
import {GUI} from 'dat-gui'
import yo from 'yo-yo'

const thumbnailDir = '../data/thumbs'

const container = document.createElement('div')
container.classList.add('container')
document.body.appendChild(container)

const films = Object.keys(palettes)

const settings = {
  canvasSize: 500,
  showColorConnections: true,
  colorThreshold: 0,
  screenshotCircleSize: 0,
  colorCircleMaxSize: 15,
  magnitudeDimension: 'lightness',
  circleSizeDimensionNegative: false,
  circleSizeDimension: 'saturation',
  magnitudeDimensionNegative: true,
  ticksAlpha: 0.04,
  showColorWheel: false
}

const gui = new GUI()
gui.add(settings, 'canvasSize', 50, 1000).step(10).onChange(renderPage)
gui.add(settings, 'colorThreshold', 0, 100).step(1).onChange(renderPage)
gui.add(settings, 'screenshotCircleSize', 0, 10).step(1).onChange(renderPage)
gui.add(settings, 'colorCircleMaxSize', 1, 40).step(1).onChange(renderPage)
// gui.add(settings, 'circleSizeDimension', ['lightness', 'saturation']).onChange(renderPage)
// gui.add(settings, 'circleSizeDimensionNegative').onChange(renderPage)
// gui.add(settings, 'magnitudeDimension', ['lightness', 'saturation']).onChange(renderPage)
// gui.add(settings, 'magnitudeDimensionNegative').onChange(renderPage)
gui.add(settings, 'showColorConnections').onChange(renderPage)
gui.add(settings, 'ticksAlpha', 0, 0.2).step(0.01).onChange(renderPage)
gui.add(settings, 'showColorWheel').onChange(renderPage)

renderPage()

function renderPage () {
  const { canvasSize } = settings
  container.innerHTML = ''
  const filmEls = films.map(film => {
    const screenshots = palettes[film]
    const padding = canvasSize * 0.05 | 0
    const canvas = yo`
      <canvas
        height=${canvasSize}
        width=${canvasSize}
        style="width: ${canvasSize}px; height: ${canvasSize}px;" />
    `
    const ctx = canvas.getContext('2d')
    renderViz(ctx, screenshots, padding)

    return yo`
      <div class="film" style="width: ${canvasSize}px">
        <h2>${film}</h2>
        ${canvas}
        <div class="screenshots">
          ${screenshots.map(screenshot => yo`
            <div>
              <ul>
                ${getColorsFromScreenshot(screenshot).map(color =>
                  yo`<li style="background-color: rgb(${color.join(',')})" />`
                )}
              </ul>
              <img src="${thumbnailDir}/${screenshot.src}" />
            </div>
          `)}
        </div>
      </div>
    `
  })

  filmEls.forEach(filmEl => container.appendChild(filmEl))
}

function renderViz (ctx, screenshots, padding) {
  const { height, width } = ctx.canvas
  const center = [width / 2 | 0, height / 2 | 0]
  const maxMagnitude = (Math.min(height, width) / 2 | 0) - padding

  if (settings.showColorWheel) {
    drawColorWheel(ctx, center, maxMagnitude)
  }

  if (settings.showColorConnections) {
    // draw all connections first
    drawColorConnections(ctx, center, maxMagnitude, screenshots)
  }

  // draw colored circles on top of the connections
  drawColorCircles(ctx, center, maxMagnitude, screenshots)
}

function drawColorCircles (ctx, center, size, screenshots) {
  const colors = screenshots.reduce((colors, screenshot) => {
    return colors.concat(getColorsFromScreenshot(screenshot))
  }, [])
  const sortedColors = sortBy(colors, (color) => {
    const [, saturation, lightness] = Color.rgb(color).hsl().array()
    const dimensions = { saturation, lightness }
    const value = dimensions[settings.circleSizeDimension]
    // reversing the order so the largest circles are painted first
    return settings.circleSizeDimensionNegative ? value : -value
  })
  sortedColors.forEach(color => {
    plotColor(ctx, color, center, size)
  })
}

function drawColorConnections (ctx, center, size, screenshots) {
  screenshots.forEach(screenshot => {
    const colors = getColorsFromScreenshot(screenshot)
    const screenshotCenter = getCenter(colors, size, center)
    colors.forEach(color => {
      const start = getCoordForColor(color, size, center)
      drawLine(ctx, start, screenshotCenter, '#efefef')
      drawCircle(ctx, screenshotCenter, settings.screenshotCircleSize, '#ccc')
    })
  })
}

function drawColorWheel (ctx, center, size) {
  const ticks = 180 * 4
  for (let i = 0; i < ticks; i++) {
    const percOfColorWheel = i / ticks
    const rads = Math.PI * 2 * percOfColorWheel
    const end = [
      Math.cos(rads) * size + center[0],
      Math.sin(rads) * size + center[1]
    ]
    const hue = 360 * percOfColorWheel | 0
    const gradient = ctx.createLinearGradient(center[0], center[1], end[0], end[1])
    const gradGranularity = 4
    for (let j = 0; j < gradGranularity; j++) {
      const lightness = (1 - (j / gradGranularity)) * 90 + 10
      const color = Color({ h: hue, s: 100, l: lightness }).alpha(settings.ticksAlpha)
      gradient.addColorStop(j / gradGranularity, color.string())
    }
    drawLine(ctx, center, end, gradient)

    // draw the outside circle
    const startRad = percOfColorWheel * Math.PI * 2
    const endRad = (i + 1) / ticks * Math.PI * 2
    const color = Color({ h: hue, s: 45, l: 50 }).alpha(0.8).string()
    drawArc(ctx, center, size + 8, startRad, endRad, 3, color)
  }
}

function getColorsFromScreenshot (screenshot) {
  const threshold = settings.colorThreshold / 100
  return screenshot.colors
    .filter(({ amount }) => threshold ? amount >= threshold : true)
    .map(({ color }) => color)
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
  const circleSize = scale * (settings.colorCircleMaxSize - 1) + 1
  drawCircle(ctx, position, circleSize, color.toString())
}

function drawArc (ctx, center, radius, startRad, endRad, width, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.arc(center[0], center[1], radius, startRad, endRad)
  ctx.stroke()
}

function drawCircle (ctx, position, radius, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(position[0], position[1], radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawLine (ctx, start, end, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(start[0], start[1])
  ctx.lineTo(end[0], end[1])
  ctx.stroke()
}
