# react-simply-carousel

[![npm version](https://img.shields.io/npm/v/react-simply-carousel.svg?style=flat)](https://www.npmjs.com/package/react-simply-carousel)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-simply-carousel?label=size)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/vadymshymko/react-simply-carousel/blob/master/LICENSE)

Simple && small controlled React.js carousel component (touch enabled, infnite and responsive)

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Demo](#demo)

## Installation

**npm**

```bash
npm install react-simply-carousel --save
```

**yarn**

```bash
yarn add react-simply-carousel
```

## Usage

#### Basic Example:

```js
import React, { Component } from "react";
import Carousel from "react-simply-carousel";

class App extends Component {
  state = {
    activeSlideIndex: 0,
  };

  setActiveSlideIndex = (newActiveSlideIndex) => {
    this.setState({
      activeSlideIndex: newActiveSlideIndex,
    });
  };

  render() {
    return (
      <Carousel
        activeSlideIndex={this.state.activeSlideIndex}
        onRequestChange={this.setActiveSlideIndex}
        itemsToShow={3}
        itemsToScroll={3}
      >
        <div style={{ width: 300, height: 300 }}>slide 0</div>
        <div style={{ width: 300, height: 300 }}>slide 1</div>
        <div style={{ width: 300, height: 300 }}>slide 2</div>
        <div style={{ width: 300, height: 300 }}>slide 3</div>
        <div style={{ width: 300, height: 300 }}>slide 4</div>
        <div style={{ width: 300, height: 300 }}>slide 5</div>
        <div style={{ width: 300, height: 300 }}>slide 6</div>
        <div style={{ width: 300, height: 300 }}>slide 7</div>
        <div style={{ width: 300, height: 300 }}>slide 8</div>
        <div style={{ width: 300, height: 300 }}>slide 9</div>
      </Carousel>
    );
  }
}
```

## Props

| Name                   | Type                             | Default Value               | Description                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| activeSlideIndex       | number                           |                             | Index of first visible children (slide)                                                                                                                                                                                                                               |
| activeSlideProps       | object                           | {}                          | DOM props for first visible slide element                                                                                                                                                                                                                             |
| autoplay               | boolean                          | false                       | Boolean indicating if the carousel should be updated automatically                                                                                                                                                                                                    |
| autoplayDirection      | string ('forward' or 'backward') | 'forward'                   | Direction of automatically updates                                                                                                                                                                                                                                    |
| backwardBtnProps       | object                           | {}                          | Contain DOM props for carousel backward button element, boolean prop `show` (for toggle button render) and node prop `children` (for render button childrens)                                                                                                         |
| children               | node                             | null                        | Array of slides                                                                                                                                                                                                                                                       |
| containerProps         | object                           | {}                          | DOM props for container div element                                                                                                                                                                                                                                   |
| delay                  | number                           | 0                           | Slide change delay (css transition delay) in ms                                                                                                                                                                                                                       |
| disableNavIfAllVisible | boolean                          | true                        | Boolean indicating if the carousel nav (by nav buttons, click on slide item, mouse move or touch move) should be disabled if all slides is visible                                                                                                                    |
| easing                 | string                           | 'linear'                    | Slide change easing (css transition easing)                                                                                                                                                                                                                           |
| forwardBtnProps        | object                           | {}                          | Contain DOM props for carousel forward button element, boolean prop `show` (for toggle button render) and node prop `children` (for render button childrens)                                                                                                          |
| hideNavIfAllVisible    | boolean                          | true                        | Boolean indicating if the carousel nav buttons should be hidden if all slides is visible                                                                                                                                                                              |
| innerProps             | object                           | {}                          | DOM props for inner div element                                                                                                                                                                                                                                       |
| itemsListProps         | object                           | {}                          | DOM props for items list div element                                                                                                                                                                                                                                  |
| itemsToScroll          | number                           | 1                           | number of slides that should be scrolled to hidden part of carousel                                                                                                                                                                                                   |
| itemsToShow            | number                           | 0 (automaticaly calculated) | number of slides that should be visible                                                                                                                                                                                                                               |
| onAfterChange          | function                         | null                        | Function that will be run after all updates is done and carousel moving is end                                                                                                                                                                                        |
| onRequestChange        | function                         |                             | Function that will be run when the activeSlideIndex is requested to be changed (either by clicking on navigation button, clicking on slide (if prop `updateOnItemClick` value is `true` ), or after drag slides)                                                      |
| responsiveProps        | Array of objects                 | []                          | carousel props for different window width. For example: `[{minWidth: 768, maxWidth: 992, itemsToShow: 3}, {maxWidth: 767, itemsToShow: 1}]` will show only one slide when window width is less than 767px and show 3 slides when window width is >= 768px and < 992px |
| speed                  | number                           | 0                           | Slide change speed (css transition speed) in ms                                                                                                                                                                                                                       |
| updateOnItemClick      | boolean                          | false                       | Boolean indicating if the `onRequestChange` prop should be called after click on some slide                                                                                                                                                                           |

## Demo

[![Edit react-simply-carousel-demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/k0fxi?fontsize=14)
