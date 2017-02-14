import palettes from './data/color-palettes.json'

const container = document.querySelector('.container')

const films = Object.keys(palettes)

const filmEls = films.map(film => {
  const filmEl = document.createElement('div')
  filmEl.classList.add('film')
  filmEl.innerHTML = `<h2>${film}</h2>`
  const screenshots = palettes[film]
  const screenshotDivs = screenshots.map(colors => {
    const ul = document.createElement('ul')
    colors.forEach(color => {
      const li = document.createElement('li')
      li.style.backgroundColor = `rgb(${color.join(',')})`
      ul.appendChild(li)
    })
    return ul
  })
  screenshotDivs.forEach(div => filmEl.appendChild(div))
  return filmEl
})

filmEls.forEach(filmEl => container.appendChild(filmEl))
