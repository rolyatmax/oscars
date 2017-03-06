import Color from 'color'
import vec2 from 'gl-vec2'

export function isVec2Equal (a, b) {
  if (a === b) return true
  const [dX, dY] = vec2.subtract([], a, b)
  return Math.abs(dX) <= 0.1 || Math.abs(dY) <= 0.1
}

export function drawColorWheel (ctx, settings, center, size) {
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
      const color = Color({ h: hue, s: 100, l: lightness }).alpha(settings.colorWheelAlpha)
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

export const toRGBString = (rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`

export function drawCircle (ctx, position, radius, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(position[0], position[1], radius, 0, Math.PI * 2)
  ctx.fill()
}

export function drawArc (ctx, center, radius, startRad, endRad, width, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.arc(center[0], center[1], radius, startRad, endRad)
  ctx.stroke()
}

export function drawLine (ctx, start, end, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(start[0], start[1])
  ctx.lineTo(end[0], end[1])
  ctx.stroke()
}
