import React, { Component } from 'react'
import lorem from 'lorem-hipsum'
import './App.css'

class App extends Component {
  render () {
    return (
      <div className='App'>
        <header>
          <div className='img-container' />
          <h1>Oscar-worthy Color Palettes</h1>
        </header>
        <section>
          <p>{lorem({ count: 5 })}</p>
          <p>{lorem({ count: 5 })}</p>
          <p>{lorem({ count: 5 })}</p>
          <p>{lorem({ count: 5 })}</p>
          <p>{lorem({ count: 5 })}</p>
        </section>
      </div>
    )
  }
}

export default App
