import palettes from '../data/color-palettes.json'
import {GUI} from 'dat-gui'
import yo from 'yo-yo'
import createColorPlot from './color-plot'
import { getColorsFromScreenshot } from './helpers'

const thumbnailDir = '../data/thumbs'

const container = document.createElement('div')
container.classList.add('container')
document.body.appendChild(container)

const films = Object.keys(palettes)

const settings = {
  canvasSize: 500,
  showColorConnections: false,
  colorThreshold: 0,
  screenshotCircleSize: 3,
  colorCircleMaxSize: 19,
  colorWheelAlpha: 0.04,
  showColorWheel: false,
  plotSaturation: false,
  plotLightness: false
}

const gui = new GUI()
gui.add(settings, 'canvasSize', 50, 1000).step(10).onChange(renderPage)
gui.add(settings, 'colorThreshold', 0, 100).step(1).onChange(draw)
gui.add(settings, 'screenshotCircleSize', 0, 10).step(1).onChange(draw)
gui.add(settings, 'colorCircleMaxSize', 1, 40).step(1).onChange(draw)
gui.add(settings, 'plotSaturation').onChange(draw)
gui.add(settings, 'plotLightness').onChange(draw)
gui.add(settings, 'showColorConnections').onChange(draw)
gui.add(settings, 'colorWheelAlpha', 0, 0.2).step(0.01).onChange(draw)
gui.add(settings, 'showColorWheel').onChange(draw)

let renderColorPlots = []
renderPage()

function renderPage () {
  renderColorPlots = []
  container.innerHTML = ''
  const filmEls = films.map(renderFilm)
  filmEls.forEach(filmEl => container.appendChild(filmEl))
  draw()
}

function draw () {
  renderColorPlots.forEach(render => render())
}

function renderFilm (film) {
  const { canvasSize } = settings
  const screenshots = palettes[film]
  const canvasContainer = yo`
    <div style="width: ${canvasSize}px; height: ${canvasSize}px;" />
  `
  const render = createColorPlot(settings, canvasContainer, screenshots)
  renderColorPlots.push(render)

  const screenshotsEls = null
  // screenshots.map(screenshot => yo`
  //   <div>
  //     <ul>
  //       ${getColorsFromScreenshot(settings, screenshot).map(color =>
  //         yo`<li style="background-color: rgb(${color.join(',')})" />`
  //       )}
  //     </ul>
  //     <img src="${thumbnailDir}/${screenshot.src}" />
  //   </div>
  // `)

  return yo`
    <div class="film" style="width: ${canvasSize}px">
      <h2>${film}</h2>
      ${canvasContainer}
      <div class="screenshots">
        ${screenshotsEls}
      </div>
    </div>
  `
}
