# react-simply-carousel

[![npm version](https://img.shields.io/npm/v/react-simply-carousel)](https://www.npmjs.com/package/react-simply-carousel)
[![minified + gzip](https://img.shields.io/bundlephobia/minzip/react-simply-carousel/latest)](https://bundlephobia.com/package/react-simply-carousel@latest)
[![typescript](https://badgen.net/npm/types/react-simply-carousel)](https://unpkg.com/react-simply-carousel/dist/index.d.ts)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/vadymshymko/react-simply-carousel/blob/master/LICENSE)

A simple, lightweight, fully controlled isomorphic (with SSR support) React.js carousel component. Touch enabled and responsive. With support for autoplay and infinity options. [Fully customizable](#props)

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
import { useState } from 'react';
import ReactSimplyCarousel from 'react-simply-carousel';

function ReactSimplyCarouselExample() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  return (
    <div>
      <ReactSimplyCarousel
        activeSlideIndex={activeSlideIndex}
        onRequestChange={setActiveSlideIndex}
        itemsToShow={1}
        itemsToScroll={1}
        forwardBtnProps={{
          //here you can also pass className, or any other button element attributes
          style: {
            alignSelf: 'center',
            background: 'black',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            height: 30,
            lineHeight: 1,
            textAlign: 'center',
            width: 30,
          },
          children: <span>{`>`}</span>,
        }}
        backwardBtnProps={{
          //here you can also pass className, or any other button element attributes
          style: {
            alignSelf: 'center',
            background: 'black',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            height: 30,
            lineHeight: 1,
            textAlign: 'center',
            width: 30,
          },
          children: <span>{`<`}</span>,
        }}
        responsiveProps={[
          {
            itemsToShow: 2,
            itemsToScroll: 2,
            minWidth: 768,
          },
        ]}
        speed={400}
        easing="linear"
      >
        {/* here you can also pass any other element attributes. Also, you can use your custom components as slides */}
        <div style={{ width: 300, height: 300, background: '#ff80ed' }}>
          slide 0
        </div>
        <div style={{ width: 300, height: 300, background: '#065535' }}>
          slide 1
        </div>
        <div style={{ width: 300, height: 300, background: '#000000' }}>
          slide 2
        </div>
        <div style={{ width: 300, height: 300, background: '#133337' }}>
          slide 3
        </div>
        <div style={{ width: 300, height: 300, background: '#ffc0cb' }}>
          slide 4
        </div>
        <div style={{ width: 300, height: 300, background: '#ffffff' }}>
          slide 5
        </div>
        <div style={{ width: 300, height: 300, background: '#ffe4e1' }}>
          slide 6
        </div>
        <div style={{ width: 300, height: 300, background: '#008080' }}>
          slide 7
        </div>
        <div style={{ width: 300, height: 300, background: '#ff0000' }}>
          slide 8
        </div>
        <div style={{ width: 300, height: 300, background: '#e6e6fa' }}>
          slide 9
        </div>
      </ReactSimplyCarousel>
    </div>
  );
}

export default ReactSimplyCarouselExample;
```

## Props

| Name                                                              | Type                                 | Default Value                  | Description                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **activeSlideIndex**                                              | number                               |                                | Index of active slide                                                                                                                                                                                                                                                                                               |
| **activeSlideProps**                                              | object                               | `{}`                           | DOM props for active slide element                                                                                                                                                                                                                                                                                  |
| **autoplay**                                                      | boolean                              | `false`                        |                                                                                                                                                                                                                                                                                                                     |
| **autoplayDirection**                                             | string (`'forward'` or `'backward'`) | `'forward'`                    |                                                                                                                                                                                                                                                                                                                     |
| **backwardBtnProps**                                              | object                               | `{}`                           | DOM props for carousel backward nav button element (include boolean prop `show` (for toggle button render) and node prop `children` (for render button childrens))                                                                                                                                                  |
| **children**                                                      | node                                 | `null`                         | slides array                                                                                                                                                                                                                                                                                                        |
| **containerProps**                                                | object                               | `{}`                           | DOM props for carousel container div element                                                                                                                                                                                                                                                                        |
| **delay**                                                         | number                               | `0`                            | Slide change delay (css transition delay) in ms                                                                                                                                                                                                                                                                     |
| **disableNavIfAllVisible**                                        | boolean                              | `true`                         | Disable carousel nav if all slides is visible                                                                                                                                                                                                                                                                       |
| **easing**                                                        | string                               | `'linear'`                     | Slide change easing (css transition easing)                                                                                                                                                                                                                                                                         |
| **forwardBtnProps**                                               | object                               | `{}`                           | DOM props for carousel forward nav button element (include boolean prop `show` (for toggle button render) and node prop `children` (for render button childrens))                                                                                                                                                   |
| **hideNavIfAllVisible**                                           | boolean                              | `true`                         | Hide nav buttons if all slides is visible                                                                                                                                                                                                                                                                           |
| **innerProps**                                                    | object                               | `{}`                           | DOM props for inner div element                                                                                                                                                                                                                                                                                     |
| **itemsListProps**                                                | object                               | `{}`                           | DOM props for items list div element                                                                                                                                                                                                                                                                                |
| **itemsToScroll**                                                 | number                               | `1`                            | How many slides to scroll at once                                                                                                                                                                                                                                                                                   |
| **itemsToShow**                                                   | number                               | `0` (automaticaly calculated)  | How many slides to show                                                                                                                                                                                                                                                                                             |
| **onAfterChange**                                                 | function                             | `null`                         | activeSlideIndex change callback                                                                                                                                                                                                                                                                                    |
| **onRequestChange**                                               | function                             |                                | Callback to handle every time the active slide changes, receives the new active index as first argument and info about visible slides (`{`<br /> ` isFirstSlideVisible: boolean;`<br />`isLastSlideVisible: boolean;`<br />`visibleSlides: { slideIndex: number; isFullyVisible: boolean }[];`<br />`}`) as second. |
| **responsiveProps**                                               | Array of objects                     | `[]`                           | carousel props for different window width. For example: `[{minWidth: 768, maxWidth: 992, itemsToShow: 3}, {maxWidth: 767, itemsToShow: 1}]` will show only one slide when window width is less than 767px and show 3 slides when window width is >= 768px and < 992px                                               |
| **speed**                                                         | number                               | `0`                            | Carousel scroll speed (css transition speed) in ms                                                                                                                                                                                                                                                                  |
| **updateOnItemClick**                                             | boolean                              | `false`                        | Update active item index after click on some slide                                                                                                                                                                                                                                                                  |
| **centerMode** (disabled if `infinite` prop disabled)             | boolean                              | `false`                        | Align active slide to the center of the carousel container viewport                                                                                                                                                                                                                                                 |
| **infinite**                                                      | boolean                              | `true`                         | Enable infinite loop scroll                                                                                                                                                                                                                                                                                         |
| **disableNavIfEdgeVisible** (disabled if `infinite` prop enabled) | boolean                              | `true`                         | Disable carousel forward nav if last slide is visible / Disable carousel backward nav if first slide is visible                                                                                                                                                                                                     |
| **disableNavIfEdgeActive**                                        | boolean                              | `true`                         | Disable carousel forward nav if activeSlideIndex === lastSlideIndex / Disable carousel backward nav if activeSlideIndex === 0                                                                                                                                                                                       |
| **dotsNav** (experimental)                                        | object                               | `{}`                           | Props for carousel dots. Includes `show` (boolean) property for toggle dots nav visibility, `containerProps` (DOM Props for dots nav wrapper div) property, `itemBtnProps` (DOM props for all dots nav buttons) property and `activeItemBtnProps` (DOM props for active dots nav button)                            |
| **persistentChangeCallbacks**                                     | boolean                              | `false`                        | Enable call `onRequestChange` prop even if activeSlideIndex equals new value                                                                                                                                                                                                                                        |
| **showSlidesBeforeInit** (deprecated)                             | boolean                              | `true`                         | Show slides on very first (initial) carousel render                                                                                                                                                                                                                                                                 |
| **visibleSlideProps**                                             | object                               | `{}`                           | DOM props for visible slide element                                                                                                                                                                                                                                                                                 |
| **autoplayDelay**                                                 | number                               | `0`                            | after what period of time the auto-update function of the active slide will be launched                                                                                                                                                                                                                             |
| **preventScrollOnSwipe**                                          | boolean                              | `false`                        | prevent vertical scroll on swipe                                                                                                                                                                                                                                                                                    |
| **disableSwipeByMouse**                                           | boolean                              | `false`                        | disable swipe by mouse                                                                                                                                                                                                                                                                                              |
| **disableSwipeByTouch**                                           | boolean                              | `false`                        | disable swipe by touch                                                                                                                                                                                                                                                                                              |
| **swipeTreshold**                                                 | number                               | half width of the active slide | minimum swipe distance in px (by touch or by mouse drag) for change slide                                                                                                                                                                                                                                           |
| **touchSwipeTreshold**                                            | number                               | half width of the active slide | minimum swipe distance in px (by touch) for change slide                                                                                                                                                                                                                                                            |
| **mouseSwipeTreshold**                                            | number                               | half width of the active slide | minimum swipe distance in px (by mouse drag) for change slide                                                                                                                                                                                                                                                       |
| **swipeRatio**                                                    | number                               | `1`                            | swipe distance ratio (on swipe by touchmove or by mouse drag)                                                                                                                                                                                                                                                       |
| **touchSwipeRatio**                                               | number                               | `swipeRatio` prop value        | swipe distance ratio (on swipe by touchmove)                                                                                                                                                                                                                                                                        |
| **mouseSwipeRatio**                                               | number                               | `swipeRatio` prop value        | swipe distance ratio (on swipe by mouse drag)                                                                                                                                                                                                                                                                       |
| **dirRTL**                                                        | boolean                              | `false`                        | Enable support for right-to-left slides content (text) direction                                                                                                                                                                                                                                                    |

## Demo

[![Edit react-simply-carousel-demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/k0fxi?fontsize=14)
