import yo from 'yo-yo'
import lorem from 'lorem-hipsum'

const styles = {
  header: {
    'width': '100vw',
    'height': '100vh',
    'background-color': '#ddd'
  },
  h1: {
    'font-size': '155px',
    'padding': '200px 0 0 0',
    'color': 'white',
    'font-family': 'Ubuntu',
    'font-weight': 800,
    'text-align': 'center',
    'letter-spacing': '-5px',
    'position': 'absolute'
  },
  imgContainer: {
    'position': 'absolute',
    'top': 0,
    'left': 0,
    'width': '100%',
    'height': '100%',
    'background-image': 'url(img/screenshot-grid.png)',
    'background-size': 'cover',
    'filter': 'brightness(70%)'
  }
}

window.lorem = lorem

export default yo`
  <div class="container">
    <header style="${stylify(styles.header)}">
      <div style="${stylify(styles.imgContainer)}"></div>
      <h1 style="${stylify(styles.h1)}">Chromatic Oscars</h1>
    </header>
    <section>
      <p>${lorem({ count: 5 })}</p>
    </section>
  </div>
`

function stylify (styles) {
  return Object.keys(styles).map(name => `${name}: ${styles[name]};`).join(' ')
}
