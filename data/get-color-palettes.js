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

const screenshotsDir = 'screenshots'

Promise.all(films.map(processFilm)).then((filmObjects) => {
  const out = filmObjects.reduce((out, filmObj) => Object.assign(out, filmObj), {})
  process.stdout.write(JSON.stringify(out))
}).catch((err) => { console.error(err) })

function processFilm (film) {
  const screenshots = fs.readdirSync(`${screenshotsDir}/${film}`)
    .filter(name => name.includes('.jpg'))
    .map(name => `${film}/${name}`)
  const promises = screenshots.map(processScreenshot)
  return Promise.all(promises).then((palettes) => ({ [film]: palettes }))
}

function processScreenshot (filename) {
  const filepath = `${screenshotsDir}/${filename}`
  return getPixels(filepath).then((result) => {
    const colors = getPalette.bins(Array.from(result.data), 5)
      .map(({ color, amount }) => ({ color, amount }))
    return {
      src: filename,
      colors: colors
    }
  })
}
