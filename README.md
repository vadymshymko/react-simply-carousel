# react-simply-carousel

![gzip size](https://img.badgesize.io/https://unpkg.com/react-simply-carousel/dist/index.js?compression=gzip)

Simple && small controlled React.js carousel component (touch enabled, infnite and responsive)

## Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Props](#props)
* [Example](#example)

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
import React, { Component } from 'react';
import Carousel from 'react-simply-carousel';

class App extends Component {
  state = {
    activeSlideIndex: 0,
  }

  setActiveSlideIndex = (newActiveSlideIndex) => {
    this.setState({
      activeSlideIndex: newActiveSlideIndex
    });
  }

  render() {
    return (
      <Carousel
        activeSlideIndex={this.state.activeSlideIndex}
        onRequestChange={this.setActiveSlideIndex}
      >
        <div style={{ width: 300, height: 300 }}>slide 0<div>
        <div style={{ width: 300, height: 300 }}>slide 1<div>
        <div style={{ width: 300, height: 300 }}>slide 2<div>
        <div style={{ width: 300, height: 300 }}>slide 3<div>
        <div style={{ width: 300, height: 300 }}>slide 4<div>
        <div style={{ width: 300, height: 300 }}>slide 5<div>
        <div style={{ width: 300, height: 300 }}>slide 6<div>
        <div style={{ width: 300, height: 300 }}>slide 7<div>
        <div style={{ width: 300, height: 300 }}>slide 8<div>
        <div style={{ width: 300, height: 300 }}>slide 9<div>
      </Carousel>
    );
  }
}
```

## Props

Name | Type | Default Value | Description   
---- | ---- | ------------- | --------------
children | node | null | Array of slides
activeSlideIndex | number | | Index of first visible children (slide)
onRequestChange | function | | Function that will be run when the activeSlideIndex is requested to be changed (either by clicking on navigation button, clicking on slide (if prop `updateOnItemClick` value is `true` ), or after drag slides)
onAfterChange | function | null | Function that will be run after all updates is done and carousel moving is end
updateOnItemClick | boolean | false | Boolean indicating if the `onRequestChange` prop should be called after click on some slide
itemsToShow | number | 0 (automaticaly calculated) | number of slides that should be visible
itemsToScroll | number | 1 | number of slides that should be scrolled to hidden part of carousel
speed | number | 0 | Slide change speed (css transition speed) in ms
delay | number | 0 | Slide change delay (css transition delay) in ms
easing | string | 'linear' | Slide change easing (css transition easing)
autoplay | boolean | false | Boolean indicating if the carousel should be updated automatically
autoplayDirection | string ('forward' or 'backward') | 'forward' | Direction of automatically updates
hideNavIfAllVisible | boolean | true | Boolean indicating if the carousel nav buttons should be hidden if all slides is visible
containerProps | object | {} | Props for container div element
innerProps | object | {} | Props for inner div element
itemsListProps | object | {} | Props for items list div element
activeSlideProps | object | {} | Props for first visible slide element
forwardBtnProps | object | {} | Props for carousel forward button element
backwardBtnProps | object | {} | Props for carousel backward button element
responsiveProps | Array of objects | [] | carousel props for different window width. For example: `[{minWidth: 768, maxWidth: 992, itemsToShow: 3}, {maxWidth: 767, itemsToShow: 1}]` will show only one slide when window width is less than 767px and show 3 slides when window width is >= 768px and < 992px

## Example

See in `example` folder. (Clone this repo, go to `example` folder and run ```yarn start ```


