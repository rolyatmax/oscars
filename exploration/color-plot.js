/* global requestAnimationFrame cancelAnimationFrame */

import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import Color from 'color'
import yo from 'yo-yo'
import vec2 from 'gl-vec2'
import { drawColorWheel, drawLine, drawCircle, toRGBString, isVec2Equal } from './helpers'

export default function createColorPlot (settings, container, screenshots) {
  const { canvasSize } = settings
  const padding = canvasSize * 0.05 | 0
  const canvas = yo`
    <canvas
      height=${canvasSize}
      width=${canvasSize}
      style="width: ${canvasSize}px; height: ${canvasSize}px;" />
  `
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const center = [canvasSize / 2 | 0, canvasSize / 2 | 0]
  const maxMagnitude = (canvasSize / 2 | 0) - padding

  let swatches = createSwatches(screenshots)
  let connections = createConnections(swatches)

  let rAFToken

  return function draw () {
    cancelAnimationFrame(rAFToken)
    rAFToken = requestAnimationFrame(renderViz)
  }

  function renderViz (t) {
    console.log(t)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    swatches = updateSwatches(swatches)
    connections = updateConnections(connections, swatches)

    const animating = swatches.some(isSwatchAnimating) || connections.some(isConnectionAnimating)
    if (animating) {
      cancelAnimationFrame(rAFToken)
      rAFToken = requestAnimationFrame(renderViz)
    }

    // if (settings.showColorWheel) {
    //   drawColorWheel(center, maxMagnitude)
    // }

    drawColorConnections(connections)

    // draw colored circles on top of the connections
    swatches.forEach(s => drawCircle(ctx, s.position, s.radius, toRGBString(s.rgb)))
  }

  function isSwatchAnimating (swatch) {
    return (
      !isVec2Equal(swatch.destPosition, swatch.position) ||
      !Math.abs(swatch.radius - swatch.destRadius) < 0.1
    )
  }

  function isConnectionAnimating (connection) {
    return (
      !isVec2Equal(connection.destPosition, connection.position) ||
      !Math.abs(connection.radius - connection.destRadius) < 0.01 ||
      connection.lines.some(line => !isVec2Equal(line.end, line.destEnd))
    )
  }

  function createSwatches (screenshots) {
    return screenshots.reduce((memo, screenshot) => {
      const swatches = screenshot.colors.map((color, i) => ({
        amount: color.amount,
        rgb: color.color,
        film: screenshot.src.split('/')[0],
        screenshot: screenshot.src,
        id: `${screenshot.src}-${i}`,
        hsl: Color.rgb(color.color).hsl().array()
      }))
      return memo.concat(swatches)
    }, [])
  }

  function createConnections (swatches) {
    const screenshots = groupBy(swatches, (swatch) => swatch.screenshot)
    return Object.values(screenshots).map((swatches) => ({
      lines: swatches.map(swatch => ({ swatch }))
    }))
  }

  function calculateCurrentVec2 (current, destination) {
    // if there's no position - stick it in the right spot to start
    if (!current || isVec2Equal(current, destination)) return destination
    const delta = vec2.subtract([], destination, current)
    const velocity = vec2.scale(delta, delta, 0.15)
    current = vec2.add([], current, velocity)
    return isVec2Equal(current, destination) ? destination : current
  }

  function calculateCurrentScalar (current, destination) {
    // if there's no radius - stick it in the right spot to start
    if (!Number.isFinite(current) || destination === current) return destination
    const delta = destination - current
    const velocity = delta * 0.15
    current = current + velocity
    return (Math.abs(current - destination) < 0.01) ? destination : current
  }

  function updateSwatches (swatches) {
    const updated = swatches.map(swatch => {
      const { destPosition, destRadius } = getCircleProperties(swatch)
      const position = calculateCurrentVec2(swatch.position, destPosition)
      const radius = calculateCurrentScalar(swatch.radius, destRadius)
      return { ...swatch, destPosition, destRadius, position, radius }
    })
    return sortBy(updated, ({ radius, hsl }) => {
      return settings.plotSaturation ? -radius : hsl[1] * hsl[2]
    })
  }

  function updateConnections (connections, swatches) {
    const swatchMap = keyBy(swatches, s => s.id)
    return connections.map((connection) => {
      // keep the swatches up to date - this is a bad way to do this but oh well
      connection.lines = connection.lines.map(line => ({
        ...line,
        swatch: swatchMap[line.swatch.id]
      }))
      const positions = connection.lines
        .filter(line => settings.colorThreshold / 100 < line.swatch.amount)
        .map(line => line.swatch.position)
      const destPosition = positions.length ? getCenter(positions) : connection.position
      const position = calculateCurrentVec2(connection.position, destPosition)
      const destRadius = settings.showColorConnections && positions.length ? settings.screenshotCircleSize : 0
      connection.lines.forEach(line => {
        const showConnectionLine = settings.showColorConnections && settings.colorThreshold / 100 < line.swatch.amount
        // if (!line.swatch.position[0])
        line.destEnd = showConnectionLine ? line.swatch.position : position
        line.end = calculateCurrentVec2(line.end, line.destEnd)
        // if (Math.random() < 0.03) console.log(line.destEnd, line.end)
      })

      const radius = calculateCurrentScalar(connection.radius, destRadius)
      return { ...connection, destPosition, destRadius, position, radius }
    })
  }

  function drawColorConnections (connections) {
    connections.forEach(connection => {
      connection.lines.forEach((line) => {
        drawLine(ctx, connection.position, line.end, '#efefef')
      })
      drawCircle(ctx, connection.position, connection.radius, '#ccc')
    })
  }

  function getCenter (positions) {
    const totals = positions.reduce((totals, [x, y]) => [totals[0] + x, totals[1] + y], [0, 0])
    return totals.map(coord => coord / positions.length)
  }

  function getCircleProperties (swatch) {
    const [hue, saturation, lightness] = swatch.hsl

    let destRadius = settings.colorCircleMaxSize / 3
    if (settings.plotSaturation) {
      destRadius = (saturation / 100) * (settings.colorCircleMaxSize - 1) + 1
    }
    if (settings.colorThreshold && swatch.amount < settings.colorThreshold / 100) {
      destRadius = 0
    }

    let magnitude = maxMagnitude / 2
    if (settings.plotLightness) {
      const magnitudePerc = lightness / 100
      magnitude = maxMagnitude * (1 - magnitudePerc)
    }
    const rads = hue / 360 * Math.PI * 2
    const destPosition = [
      Math.cos(rads) * magnitude + center[0],
      Math.sin(rads) * magnitude + center[1]
    ]

    return { destPosition, destRadius }
  }
}
