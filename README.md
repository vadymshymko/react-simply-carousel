# react-simply-carousel

[![npm version](https://img.shields.io/npm/v/react-simply-carousel.svg?style=flat)](https://www.npmjs.com/package/react-simply-carousel)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-simply-carousel@latest?label=size)
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

| Name                                                              | Type                                 | Default Value                 | Description                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **activeSlideIndex**                                              | number                               |                               | Index of active slide                                                                                                                                                                                                                                                 |
| **activeSlideProps**                                              | object                               | `{}`                          | DOM props for active slide element                                                                                                                                                                                                                                    |
| **autoplay**                                                      | boolean                              | `false`                       |                                                                                                                                                                                                                                                                       |
| **autoplayDirection**                                             | string (`'forward'` or `'backward'`) | `'forward'`                   |                                                                                                                                                                                                                                                                       |
| **backwardBtnProps**                                              | object                               | `{}`                          | DOM props for carousel backward nav button element (include boolean prop `show` (for toggle button render) and node prop `children` (for render button childrens))                                                                                                    |
| **children**                                                      | node                                 | `null`                        | slides array                                                                                                                                                                                                                                                          |
| **containerProps**                                                | object                               | `{}`                          | DOM props for carousel container div element                                                                                                                                                                                                                          |
| **delay**                                                         | number                               | `0`                           | Slide change delay (css transition delay) in ms                                                                                                                                                                                                                       |
| **disableNavIfAllVisible**                                        | boolean                              | `true`                        | Disable carousel nav if all slides is visible                                                                                                                                                                                                                         |
| **easing**                                                        | string                               | `'linear'`                    | Slide change easing (css transition easing)                                                                                                                                                                                                                           |
| **forwardBtnProps**                                               | object                               | `{}`                          | DOM props for carousel forward nav button element (include boolean prop `show` (for toggle button render) and node prop `children` (for render button childrens))                                                                                                     |
| **hideNavIfAllVisible**                                           | boolean                              | `true`                        | Hide nav buttons if all slides is visible                                                                                                                                                                                                                             |
| **innerProps**                                                    | object                               | `{}`                          | DOM props for inner div element                                                                                                                                                                                                                                       |
| **itemsListProps**                                                | object                               | `{}`                          | DOM props for items list div element                                                                                                                                                                                                                                  |
| **itemsToScroll**                                                 | number                               | `1`                           | How many slides to scroll at once                                                                                                                                                                                                                                     |
| **itemsToShow**                                                   | number                               | `0` (automaticaly calculated) | How many slides to show                                                                                                                                                                                                                                               |
| **onAfterChange**                                                 | function                             | `null`                        | activeSlideIndex change callback                                                                                                                                                                                                                                      |
| **onRequestChange**                                               | function                             |                               | Callback to handle every time the active slide changes, receives the new active index as arguments.                                                                                                                                                                   |
| **responsiveProps**                                               | Array of objects                     | `[]`                          | carousel props for different window width. For example: `[{minWidth: 768, maxWidth: 992, itemsToShow: 3}, {maxWidth: 767, itemsToShow: 1}]` will show only one slide when window width is less than 767px and show 3 slides when window width is >= 768px and < 992px |
| **speed**                                                         | number                               | `0`                           | Carousel scroll speed (css transition speed) in ms                                                                                                                                                                                                                    |
| **updateOnItemClick**                                             | boolean                              | `false`                       | Update active item index after click on some slide                                                                                                                                                                                                                    |
| **centerMode** (disabled if `infinite` prop disabled)             | boolean                              | `false`                       | Align active slide to the center of the carousel container viewport                                                                                                                                                                                                   |
| **infinite**                                                      | boolean                              | `true`                        | Enable infinite loop scroll                                                                                                                                                                                                                                           |
| **disableNavIfEdgeVisible** (disabled if `infinite` prop enabled) | boolean                              | `true`                        | Disable carousel forward nav if last slide is visible / Disable carousel backward nav if first slide is visible                                                                                                                                                       |
| **disableNavIfEdgeActive**                                        | boolean                              | `true`                        | Disable carousel forward nav if activeSlideIndex === lastSlideIndex / Disable carousel backward nav if activeSlideIndex === 0                                                                                                                                         |
| **dotsNav (experimental)** (disabled if `infinite` prop enabled)  | object                               | `{}`                          | Props for carousel dots. includes `show` (boolean) for toggle dots nav visibility, activeClassName (className for active dot) and DOM props for all dots nav buttons                                                                                                  |
| **dotsNavWrapperProps**                                           | object                               | `{}`                          | DOM Props for dots nav wrapper div                                                                                                                                                                                                                                    |

## Demo

[![Edit react-simply-carousel-demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/k0fxi?fontsize=14)
