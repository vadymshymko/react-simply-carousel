import React, { Component, Children, createRef } from 'react';
import PropTypes from 'prop-types';

class ReactSimplyCarousel extends Component {
  constructor(props) {
    super(props);

    this.containerRef = createRef();
    this.innerRef = createRef();
    this.itemsListRef = createRef();

    this.autoplayTimer = null;
    this.itemsListDragStartPos = null;
    this.resizeTimer = null;

    this.direction = '';
    this.slides = [];

    this.state = {
      windowWidth: 0,
      positionIndex: props.activeSlideIndex,
    };
  }

  componentDidMount() {
    this.handleInitializationEnd();

    window.addEventListener('resize', this.handleWindowResize);
  }

  componentDidUpdate(prevProps, prevState) {
    const { activeSlideIndex: prevActiveSlideIndex } = this.getRenderProps(
      prevState,
      prevProps,
    );
    const { activeSlideIndex, speed, delay } = this.renderProps;

    if (activeSlideIndex === prevActiveSlideIndex) {
      this.direction = '';
    } else if (!speed && !delay) {
      this.updatePositionIndex();
    }
  }

  componentWillUnmount() {
    this.stopAutoplay();

    clearTimeout(this.resizeTimer);
    window.removeEventListener('resize', this.handleWindowResize);

    document.removeEventListener('mousemove', this.handleItemsListMouseMove);
    document.removeEventListener('mouseup', this.handleItemsListMouseUp);
    document.removeEventListener('touchmove', this.handleItemsListTouchMove);
    document.removeEventListener('touchend', this.handleItemsListTouchEnd);

    this.itemsListRef.current.removeEventListener(
      'mouseout',
      this.handleItemsListMouseUp,
    );
    this.itemsListRef.current.removeEventListener(
      'dragstart',
      this.handleItemsListMouseUp,
    );
  }

  getRenderProps = (state, props) => {
    const { windowWidth } = state;

    const { responsiveProps, ...restProps } = props;

    if (!windowWidth) {
      return restProps;
    }

    const propsByWindowWidth = responsiveProps.reduce(
      (result, { minWidth = 0, maxWidth = null, ...item } = {}) => {
        if (windowWidth > minWidth && (!maxWidth || windowWidth <= maxWidth)) {
          return {
            ...result,
            ...item,
          };
        }

        return result;
      },
      restProps,
    );

    const slidesCount = Children.toArray(propsByWindowWidth.children).length;

    return {
      ...propsByWindowWidth,
      activeSlideIndex: Math.max(
        0,
        Math.min(propsByWindowWidth.activeSlideIndex, slidesCount - 1),
      ),
      itemsToShow: Math.min(slidesCount, propsByWindowWidth.itemsToShow),
      itemsToScroll: Math.min(slidesCount, propsByWindowWidth.itemsToScroll),
    };
  };

  getInnerWidth = () => {
    const { windowWidth } = this.state;
    const { activeSlideIndex, itemsToShow } = this.renderProps;

    if (!windowWidth || !itemsToShow) {
      return null;
    }

    return this.slides.reduce((result, item, index) => {
      const isItemVisible = (index >= activeSlideIndex && index < activeSlideIndex + itemsToShow)
        || (index < activeSlideIndex
          && index < activeSlideIndex + itemsToShow - this.slides.length);

      if (!isItemVisible) {
        return result;
      }

      return result + item.offsetWidth;
    }, 0);
  };

  getItemsListOffsetBySlideIndex = (slideIndex) => {
    const offsetByIndex = this.slides.reduce((total, item, index) => {
      if (index >= slideIndex) {
        return total;
      }

      return total + (item.offsetWidth || 0);
    }, 0);

    return offsetByIndex;
  };

  getOffsetCorrectionForEdgeSlides = (activeSlideIndex, positionIndex) => {
    if (positionIndex - activeSlideIndex === 0) {
      return 0;
    }

    if (
      this.direction.toLowerCase() === 'forward'
      && activeSlideIndex < positionIndex
    ) {
      return this.itemsListRef.current.offsetWidth / 3;
    }

    if (
      this.direction.toLowerCase() === 'backward'
      && activeSlideIndex > positionIndex
    ) {
      return -this.itemsListRef.current.offsetWidth / 3;
    }

    return 0;
  };

  getSlideItemOnClick = ({
    activeSlideIndex, direction, index, onClick,
  }) => {
    const slideItemOnClick = (event) => {
      const forwardDirectionValue = activeSlideIndex < index ? 'forward' : '';
      const backwardDirectionValue = activeSlideIndex > index ? 'backward' : '';

      this.updateActiveSlideIndex(
        index,
        direction || forwardDirectionValue || backwardDirectionValue,
      );

      if (onClick) {
        onClick(event);
      }
    };

    return slideItemOnClick;
  };

  getNextSlideIndex = (direction) => {
    const { activeSlideIndex, itemsToScroll, children } = this.renderProps;

    const lastSlideIndex = Children.count(children) - 1;

    if (direction === 'forward') {
      const nextSlideIndex = activeSlideIndex + itemsToScroll;
      const isOnEnd = nextSlideIndex > lastSlideIndex;
      const newSlideIndex = isOnEnd
        ? nextSlideIndex - lastSlideIndex - 1
        : nextSlideIndex;

      return newSlideIndex;
    }

    if (direction === 'backward') {
      const nextSlideIndex = activeSlideIndex - itemsToScroll;
      const isOnStart = nextSlideIndex < 0;
      const newSlideIndex = isOnStart
        ? lastSlideIndex + 1 + nextSlideIndex
        : nextSlideIndex;

      return newSlideIndex;
    }

    return activeSlideIndex;
  };

  updateActiveSlideIndex = (newActiveSlideIndex, direction) => {
    const {
      activeSlideIndex,
      onRequestChange,
      speed,
      delay,
      easing,
    } = this.renderProps;

    this.itemsListRef.current.style.transition = speed || delay ? `transform ${speed}ms ${easing} ${delay}ms` : null;

    if (newActiveSlideIndex !== activeSlideIndex) {
      this.stopAutoplay();

      this.direction = direction;
      onRequestChange(newActiveSlideIndex);
    } else {
      this.itemsListRef.current.style.transform = `translateX(-${
        this.itemsListRef.current.offsetWidth / 3
      }px)`;

      if (!speed && !delay) {
        this.updatePositionIndex();
      }
    }
  };

  updatePositionIndex = () => {
    const { activeSlideIndex, onAfterChange } = this.renderProps;
    const { positionIndex } = this.state;

    this.setState(
      () => ({
        positionIndex: activeSlideIndex,
      }),
      () => {
        this.itemsListDragStartPos = null;
        this.isListDragging = false;

        this.startAutoplay();

        if (onAfterChange) {
          onAfterChange(activeSlideIndex, positionIndex);
        }
      },
    );
  };

  startAutoplay = () => {
    const { autoplay, autoplayDirection, delay } = this.renderProps;

    if (autoplay) {
      this.autoplayTimer = setTimeout(() => {
        this.updateActiveSlideIndex(
          this.getNextSlideIndex(autoplayDirection),
          autoplayDirection,
        );
      }, delay);
    }
  };

  stopAutoplay = () => {
    clearTimeout(this.autoplayTimer);
  };

  handleInitializationEnd = () => {
    this.setState(
      () => ({
        windowWidth: window.innerWidth,
      }),
      this.startAutoplay,
    );
  };

  handleWindowResize = () => {
    clearTimeout(this.resizeTimer);

    this.resizeTimer = setTimeout(this.handleInitializationEnd, 400);
  };

  handleContainerClickCapture = (event) => {
    const {
      containerProps: { onClickCapture: containerOnClickCapture },
    } = this.renderProps;

    if (this.isListDragging) {
      event.preventDefault();
      event.stopPropagation();

      if (containerOnClickCapture) {
        containerOnClickCapture(event);
      }
    }
  };

  handleBackwardBtnClick = () => {
    this.updateActiveSlideIndex(this.getNextSlideIndex('backward'), 'backward');
  };

  handleForwardBtnClick = () => {
    this.updateActiveSlideIndex(this.getNextSlideIndex('forward'), 'forward');
  };

  updateItemsListPosByDragPos = (dragPos) => {
    const dragPosDiff = this.itemsListDragStartPos
      - dragPos
      + this.itemsListRef.current.offsetWidth / 3;
    const minDragPos = 0;
    const maxDragPos = this.itemsListRef.current.offsetWidth - this.innerRef.current.offsetWidth;
    const itemsListPos = Math.max(
      Math.min(minDragPos, -dragPosDiff),
      -maxDragPos,
    );

    this.itemsListRef.current.style.transition = 'none';
    this.itemsListRef.current.style.transform = `translateX(${itemsListPos}px)`;
  };

  handleItemsListDragEnd = (dragPos) => {
    const { activeSlideIndex } = this.renderProps;
    const mousePosDiff = this.itemsListDragStartPos - dragPos;
    const activeItemHalfWidth = this.slides[activeSlideIndex].offsetWidth / 2;

    if (mousePosDiff > activeItemHalfWidth) {
      this.updateActiveSlideIndex(this.getNextSlideIndex('forward'), 'forward');
    } else if (mousePosDiff < -activeItemHalfWidth) {
      this.updateActiveSlideIndex(
        this.getNextSlideIndex('backward'),
        'backward',
      );
    } else {
      this.updateActiveSlideIndex(activeSlideIndex, 'forward');
    }
  };

  handleItemsListMouseMove = (event) => {
    this.isListDragging = true;

    this.updateItemsListPosByDragPos(event.clientX);
  };

  handleItemsListMouseUp = (event) => {
    this.itemsListRef.current.removeEventListener(
      'mouseout',
      this.handleItemsListMouseUp,
    );
    this.itemsListRef.current.removeEventListener(
      'dragstart',
      this.handleItemsListMouseUp,
    );

    document.removeEventListener('mousemove', this.handleItemsListMouseMove);
    document.removeEventListener('mouseup', this.handleItemsListMouseUp);

    if (this.isListDragging) {
      this.handleItemsListDragEnd(event.clientX);
    }
  };

  handleItemsListMouseDown = (event) => {
    this.stopAutoplay();

    if (!this.isListDragging) {
      this.itemsListDragStartPos = event.clientX;

      document.addEventListener('mousemove', this.handleItemsListMouseMove);
      document.addEventListener('mouseup', this.handleItemsListMouseUp);

      this.itemsListRef.current.addEventListener(
        'mouseout',
        this.handleItemsListMouseUp,
      );
      this.itemsListRef.current.addEventListener(
        'dragstart',
        this.handleItemsListMouseUp,
      );
    }
  };

  handleItemsListTouchMove = (event) => {
    this.isListDragging = true;
    this.updateItemsListPosByDragPos(event.touches[0].clientX);
  };

  handleItemsListTouchEnd = (event) => {
    document.removeEventListener('touchmove', this.handleItemsListTouchMove);
    document.removeEventListener('touchend', this.handleItemsListTouchEnd);

    if (this.isListDragging) {
      this.handleItemsListDragEnd(
        event.changedTouches[event.changedTouches.length - 1].clientX,
      );
    }
  };

  handleItemsListTouchStart = (event) => {
    this.stopAutoplay();

    if (!this.isListDragging) {
      this.itemsListDragStartPos = event.touches[0].clientX;

      document.addEventListener('touchmove', this.handleItemsListTouchMove);
      document.addEventListener('touchend', this.handleItemsListTouchEnd);
    }
  };

  renderSlidesItems = (items, startIndex, disableNav) => {
    const {
      activeSlideIndex,
      activeSlideProps: {
        className: activeSlideClassName = '',
        style: activeSlideStyle = {},
        ...activeSlideProps
      },
      updateOnItemClick,
    } = this.renderProps;

    return items.map((item, index) => {
      const {
        props: {
          className: itemClassName = '',
          onClick: itemOnClick,
          style: itemStyle = {},
          ...itemComponentProps
        } = {},
        ...slideComponentData
      } = item;

      const direction = this.renderedSlidesCount >= this.slidesCount ? 'forward' : 'backward';

      const isActive = index + startIndex === activeSlideIndex;

      const className = `${itemClassName} ${
        isActive ? activeSlideClassName : ''
      }`;
      const style = {
        ...itemStyle,
        ...(isActive ? activeSlideStyle : {}),
        boxSizing: 'border-box',
        margin: 0,
      };
      const onClick = !disableNav && updateOnItemClick
        ? this.getSlideItemOnClick({
          activeSlideIndex,
          direction,
          index: index + startIndex,
          onClick: itemOnClick,
        })
        : itemOnClick;
      const props = {
        role: 'tabpanel',
        className,
        style,
        onClick,
        ...itemComponentProps,
        ...(isActive ? activeSlideProps : {}),
      };

      this.renderedSlidesCount += 1;

      return {
        props,
        ...slideComponentData,
      };
    });
  };

  render() {
    const { windowWidth, positionIndex } = this.state;

    this.renderProps = this.getRenderProps(this.state, this.props);

    const {
      activeSlideIndex,
      backwardBtnProps: {
        children: backwardBtnChildren = null,
        show: showBackwardBtn = true,
        ...backwardBtnProps
      },
      children,
      containerProps: {
        style: containerStyle,
        onClickCapture: containerOnClickCapture,
        ...containerProps
      },
      delay,
      disableNavIfAllVisible,
      easing,
      forwardBtnProps: {
        children: forwardBtnChildren = null,
        show: showForwardBtn = true,
        ...forwardBtnProps
      },
      hideNavIfAllVisible,
      innerProps: { style: innerStyle, ...innerProps },
      itemsListProps: {
        style: itemsListStyle,
        onTouchStart: onItemsListTouchStart,
        onMouseDown: onItemsListMouseDown,
        onTransitionEnd: onItemsListTransitionEnd,
        ...itemsListProps
      },
      itemsToShow,
      speed,
    } = this.renderProps;

    const slidesItems = Children.toArray(children);

    this.slides = windowWidth
      ? [...this.itemsListRef.current.children].slice(
        slidesItems.length - positionIndex,
        slidesItems.length - positionIndex + slidesItems.length,
      )
      : [];

    const innerWidth = this.getInnerWidth();
    const innerStyleWidth = innerStyle && innerStyle.width
      ? innerStyle.width
      : null;

    const isAllSlidesVisible = itemsToShow === slidesItems.length;

    const hideNav = hideNavIfAllVisible && isAllSlidesVisible;
    const disableNav = disableNavIfAllVisible && isAllSlidesVisible;

    const isNewSLideIndex = activeSlideIndex - positionIndex !== 0;

    const positionIndexOffset = windowWidth && isNewSLideIndex
      ? this.getItemsListOffsetBySlideIndex(positionIndex)
      : 0;
    const activeSlideIndexOffset = windowWidth && isNewSLideIndex
      ? this.getItemsListOffsetBySlideIndex(activeSlideIndex)
      : 0;

    const itemsListTransition = !isNewSLideIndex || !(speed || delay)
      ? null
      : `transform ${speed}ms ${easing} ${delay}ms`;
    const itemsListTranslateX = disableNav || !windowWidth
      ? 0
      : activeSlideIndexOffset
          - positionIndexOffset
          + this.getOffsetCorrectionForEdgeSlides(
            activeSlideIndex,
            positionIndex,
          )
          + this.itemsListRef.current.offsetWidth / 3;
    const itemsListTransform = windowWidth
      ? `translateX(-${itemsListTranslateX}px)`
      : null;

    this.slidesCount = slidesItems.length;
    this.renderedSlidesCount = 0;

    return (
      <div
        onClickCapture={this.handleContainerClickCapture}
        style={{
          display: 'flex',
          boxSizing: 'border-box',
          justifyContent: 'center',
          ...(containerStyle || {}),
        }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...containerProps}
        ref={this.containerRef}
      >
        {showBackwardBtn && !hideNav && (
          <button
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...backwardBtnProps}
            type="button"
            onClick={this.handleBackwardBtnClick}
          >
            {backwardBtnChildren}
          </button>
        )}

        <div
          style={{
            display: 'flex',
            boxSizing: 'border-box',
            flexFlow: 'row wrap',
            maxWidth: '100%',
            padding: '0',
            overflow: 'hidden',
            width: innerWidth
              ? `${innerWidth}px`
              : innerStyleWidth,
            ...innerStyle,
          }}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...innerProps}
          ref={this.innerRef}
        >
          {/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
          <div
            style={{
              display: 'flex',
              boxSizing: 'border-box',
              outline: 'none',
              ...(itemsListStyle || {}),
              transition: itemsListTransition,
              transform: itemsListTransform,
            }}
            onTouchStart={disableNav ? null : this.handleItemsListTouchStart}
            onMouseDown={disableNav ? null : this.handleItemsListMouseDown}
            onTransitionEnd={speed || delay ? this.updatePositionIndex : null}
            tabIndex="-1"
            role="presentation"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...itemsListProps}
            ref={this.itemsListRef}
          >
            {!disableNav
              && this.renderSlidesItems(
                slidesItems.slice(positionIndex),
                positionIndex,
              )}
            {this.renderSlidesItems(slidesItems, 0, disableNav)}
            {!disableNav && this.renderSlidesItems(slidesItems, 0)}
            {!disableNav
              && this.renderSlidesItems(slidesItems.slice(0, positionIndex), 0)}
          </div>
        </div>

        {showForwardBtn && !hideNav && (
          <button
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...forwardBtnProps}
            type="button"
            onClick={this.handleForwardBtnClick}
          >
            {forwardBtnChildren}
          </button>
        )}
      </div>
    );
  }
}

ReactSimplyCarousel.propTypes = {
  activeSlideIndex: PropTypes.number.isRequired,
  activeSlideProps: PropTypes.objectOf(PropTypes.any),
  autoplay: PropTypes.bool,
  autoplayDirection: PropTypes.oneOf(['forward', 'backward']),
  backwardBtnProps: PropTypes.objectOf(PropTypes.any),
  centerMode: PropTypes.bool,
  children: PropTypes.node,
  containerProps: PropTypes.objectOf(PropTypes.any),
  delay: PropTypes.number,
  disableNavIfAllVisible: PropTypes.bool,
  easing: PropTypes.string,
  forwardBtnProps: PropTypes.objectOf(PropTypes.any),
  hideNavIfAllVisible: PropTypes.bool,
  innerProps: PropTypes.objectOf(PropTypes.any),
  itemsListProps: PropTypes.objectOf(PropTypes.any),
  itemsToScroll: PropTypes.number,
  itemsToShow: PropTypes.number,
  onAfterChange: PropTypes.func,
  onRequestChange: PropTypes.func.isRequired,
  responsiveProps: PropTypes.arrayOf(PropTypes.object),
  speed: PropTypes.number,
  updateOnItemClick: PropTypes.bool,
};

ReactSimplyCarousel.defaultProps = {
  activeSlideProps: {},
  autoplay: false,
  autoplayDirection: 'forward',
  backwardBtnProps: {},
  centerMode: false,
  children: null,
  containerProps: {},
  delay: 0,
  disableNavIfAllVisible: true,
  easing: 'linear',
  forwardBtnProps: {},
  hideNavIfAllVisible: true,
  innerProps: {},
  itemsListProps: {},
  itemsToScroll: 1,
  itemsToShow: 0,
  onAfterChange: null,
  responsiveProps: [],
  speed: 0,
  updateOnItemClick: false,
};

export default ReactSimplyCarousel;
