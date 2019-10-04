import React, { Component } from 'react';
import Carousel from 'react-simply-carousel';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  state = {
    activeSlideIndex: 0,
  }

  goToSlide = (activeSlideIndex) => {
    this.setState(() => ({
      activeSlideIndex,
    }));
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>

        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>

        <Carousel
          activeSlideIndex={this.state.activeSlideIndex}
          onRequestChange={this.goToSlide}
          speed={1000}
          delay={1000}
          easing={'linear'}
        >
          {Array.from({ length: 10 }).map((item, index) => (
            <div
              style={{
                height: '300px',
                width: '300px',
                fontSize: "240px",
                border: "30px solid #fff",
                backgroundColor: "#000",
                color: "#fff",
              }}
              key={index}
            >
              {index}
            </div>
          ))}
        </Carousel>
      </div>
    );
  }
}

export default App;
