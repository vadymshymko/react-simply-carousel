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
          <p>
            Edit <code>src/App.js</code> and save to reload.
        </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
        </a>
        </header>

        <Carousel
          activeSlideIndex={this.state.activeSlideIndex}
          onRequestChange={this.goToSlide}
          speed={1000}
          delay={1000}
          easing={'linear'}
          itemsToShow={3}
          itemsToScroll={3}
          forwardBtnProps={{
            children: 'Forward',
            style: {
              padding: 15,
            }
          }}
          backwardBtnProps={{
            children: 'Backward',
            style: {
              padding: 15,
            }
          }}
          responsiveProps={[
            {
              maxWidth: 768,
              itemsToShow: 3,
            },
            {
              maxWidth: 480,
              itemsToShow: 1,

              forwardBtnProps: {
                children: 'For',
                style: {
                  padding: 15,
                }
              },
              backwardBtnProps: {
                children: 'Back',
                style: {
                  padding: 15,
                }
              },
            }
          ]}
        >
          {Array.from({ length: 5 }).map((item, index) => (
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
    )
  }
}

export default App;
