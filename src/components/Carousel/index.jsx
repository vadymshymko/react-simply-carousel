import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

import styles from './ReactJSSimpleCarousel.scss';

class ReactJSSimpleCarousel extends Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    inner: PropTypes.shape({
      className: PropTypes.string,
    }),
    list: PropTypes.shape({
      className: PropTypes.string,
      style: PropTypes.object,
    }),
    slide: PropTypes.shape({
      className: PropTypes.string,
    }),
    onRequestChange: PropTypes.func,
    activeSlideIndex: PropTypes.number,
    autoplay: PropTypes.bool,
    autoplayDelay: PropTypes.number,
    autoplayDirection: PropTypes.oneOf([
      'left',
      'right',
    ]),
  }

  static defaultProps = {
    children: null,
    className: '',
    inner: {
      className: '',
    },
    list: {
      className: '',
      style: {},
    },
    slide: {
      className: '',
    },
    onRequestChange: () => {},
    activeSlideIndex: 0,
    autoplay: false,
    autoplayDelay: 800,
    autoplayDirection: 'right',
  }

  constructor(props) {
    super(props);

    this.autoplayInterval = null;
  }

  state = {
    isMounted: false,
  }

  componentDidMount() {
    this.handleMountEnd();
  }

  getSlidesListOffset = (lastSlideIndex) => {
    const offsetByActiveSlide = this.slides.reduce((total, slide, slideIndex) => {
      if (slideIndex >= lastSlideIndex) {
        return total;
      }

      return total + slide.offsetWidth;
    }, 0);

    const maxOffset = this.slidesList.offsetWidth - this.inner.offsetWidth;

    const offset = Math.max(
      0,
      Math.min(
        offsetByActiveSlide,
        maxOffset,
      ),
    );

    return offset;
  }

  getValidatedSlideIndex = index => (
    Math.max(
      0,
      Math.min(
        index,
        Children.toArray(this.props.children).length - 1,
      ),
    )
  )

  goToSlide = (slideIndex) => {
    const validatedSlideIndex = this.getValidatedSlideIndex(slideIndex);
    const lastAutoplaySlideIndex = this.props.autoplayDirection === 'right'
      ? Children.toArray(this.props.children).length - 1
      : 0;

    if (validatedSlideIndex !== this.props.activeSlideIndex) {
      this.props.onRequestChange(validatedSlideIndex);
    } else if (
      validatedSlideIndex === this.props.activeSlideIndex
      && this.props.activeSlideIndex === lastAutoplaySlideIndex
      && this.autoplayInterval
    ) {
      clearInterval(this.autoplayInterval);
    }
  }

  handleMountEnd = () => {
    this.setState(() => ({
      isMounted: true,
    }), () => {
      if (this.props.autoplay) {
        this.autoplayInterval = setInterval(() => {
          const nextActiveSlideIndex = (
            this.props.autoplayDirection === 'right'
              ? this.props.activeSlideIndex + 1
              : this.props.activeSlideIndex - 1
          );

          this.goToSlide(nextActiveSlideIndex);
        }, this.props.autoplayDelay);
      }
    });
  }

  render() {
    const {
      className,
      inner: {
        className: innerClassName,
        ...innerProps
      },
      list: {
        className: listClassName,
        style: listStyle,
        ...listProps
      },
      slide: {
        className: slideClassName,
        ...slideProps
      },
      children,
      onRequestChange,
      activeSlideIndex,
      autoplay,
      autoplayDelay,
      autoplayDirection,
      ...props
    } = this.props;

    const validatedActiveSlideIndex = this.getValidatedSlideIndex(activeSlideIndex);
    const slidesListOffset = this.state.isMounted
      ? `-${this.getSlidesListOffset(validatedActiveSlideIndex)}px`
      : null;

    this.slides = [];

    return (
      <div
        className={`${styles.ReactJSSimpleCarousel || ''} ${className}`}
        {...props}
        ref={(node) => { this.container = node; }}
      >

        <div
          className={`${styles.ReactJSSimpleCarousel__inner || ''} ${innerClassName}`}
          {...innerProps}
          ref={(node) => { this.inner = node; }}
        >
          <div
            className={`${styles.ReactJSSimpleCarousel__list || ''} ${listClassName}`}
            style={{
              ...listStyle,
              marginLeft: slidesListOffset,
            }}
            {...listProps}
            ref={(node) => { this.slidesList = node; }}
          >
            {Children.map(children, (item, slideIndex) => (
              <div
                className={`
                  ${styles.ReactJSSimpleCarousel__slide || ''}
                  ${slideClassName}
                `}
                key={item.key}
                {...slideProps}
                ref={(node) => {
                  this.slides[slideIndex] = node;
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }
}

export default ReactJSSimpleCarousel;
