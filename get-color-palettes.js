const fs = require('fs')
const promisify = require('promisify-node')
const getPixels = promisify(require('get-pixels'))
const getPalette = require('get-rgba-palette')

const films = [
  'arrival',
  'moonlight',
  'la-la-land',
  'lion',
  'silence'
]

Promise.all(films.map(processFilm)).then((filmPalettes) => {
  const out = {}
  filmPalettes.forEach((palettes, i) => {
    const filmName = films[i]
    out[filmName] = palettes
  })
  process.stdout.write(JSON.stringify(out))
}).catch((err) => { console.error(err) })

function processFilm (film) {
  const screenshotsDir = `data/screenshots/${film}`
  const screenshots = fs.readdirSync(screenshotsDir)
    .filter(name => name.includes('.jpg'))
    .map(name => `${screenshotsDir}/${name}`)
  const promises = screenshots.map(getColorPalette)
  return Promise.all(promises)
}

function getColorPalette (filename) {
  return getPixels(filename).then((result) => getPalette(Array.from(result.data), 5))
}