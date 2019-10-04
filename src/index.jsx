import React, { Component, Children, createRef } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.less';

class ReactJSSimpleCarousel extends Component {
  static propTypes = {
    activeSlideIndex: PropTypes.number.isRequired,
    onRequestChange: PropTypes.func.isRequired,
    onAfterChange: PropTypes.func,
    updateOnItemClick: PropTypes.bool,
    children: PropTypes.node,
    speed: PropTypes.number,
    delay: PropTypes.number,
    easing: PropTypes.string,
    autoplay: PropTypes.bool,
    autoplayDirection: PropTypes.oneOf(['forward', 'backward']),

    containerProps: PropTypes.objectOf(PropTypes.any),
    innerProps: PropTypes.objectOf(PropTypes.any),
    itemsListProps: PropTypes.objectOf(PropTypes.any),
    activeSlideProps: PropTypes.objectOf(PropTypes.any),

    forwardBtnProps: PropTypes.objectOf(PropTypes.any),
    backwardBtnProps: PropTypes.objectOf(PropTypes.any),
  };

  static defaultProps = {
    onAfterChange: () => {},
    children: null,
    speed: 0,
    delay: 0,
    easing: 'linear',
    updateOnItemClick: false,
    autoplay: false,
    autoplayDirection: 'forward',

    containerProps: {},
    innerProps: {},
    itemsListProps: {},
    activeSlideProps: {},

    forwardBtnProps: {},
    backwardBtnProps: {},
  };

  constructor(props) {
    super(props);

    this.containerRef = createRef();
    this.innerRef = createRef();
    this.itemsListRef = createRef();

    this.resizeTimer = null;
    this.autoplayTimer = null;
    this.itemsListDragStartPos = null;

    this.direction = '';
    this.slides = [];

    this.state = {
      isInitialized: false,
      positionIndex: props.activeSlideIndex,
    };
  }

  componentDidMount() {
    this.handleInitializationEnd();

    window.addEventListener('resize', this.handleWindowResize);
  }

  componentDidUpdate(prevProps) {
    const { activeSlideIndex: prevActiveSlideIndex } = prevProps;
    const { activeSlideIndex } = this.props;

    if (activeSlideIndex === prevActiveSlideIndex) {
      this.direction = '';
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
  }

  disableItemsListTransition = () => {
    this.itemsListRef.current.style.transition = 'none';
  };

  enableItemsListTransition = () => {
    const { speed, delay, easing } = this.props;

    this.itemsListRef.current.style.transition = speed || delay
      ? `transform ${speed}ms ${easing} ${delay}ms`
      : null;
  };

  getLastSlideIndex = () => {
    const { children } = this.props;

    return Children.count(children) - 1;
  };

  getItemsListOffsetBySlideIndex = (slideIndex) => {
    const offsetByIndex = this.slides.reduce((total, item = {}, index) => {
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

    if (this.direction.toLowerCase() === 'forward' && activeSlideIndex < positionIndex) {
      return this.itemsListRef.current.offsetWidth / 3;
    }

    if (this.direction.toLowerCase() === 'backward' && activeSlideIndex > positionIndex) {
      return -this.itemsListRef.current.offsetWidth / 3;
    }

    return 0;
  }

  getSlideItemOnClick = (index, direction, onClick) => {
    const { activeSlideIndex } = this.props;

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
  }

  getNextSlideIndex = (direction) => {
    const { activeSlideIndex } = this.props;

    const lastSlideIndex = this.getLastSlideIndex();

    if (direction === 'forward') {
      const nextSlideIndex = activeSlideIndex + 1;
      const isOnEnd = nextSlideIndex > lastSlideIndex;
      const newSlideIndex = isOnEnd ? 0 : nextSlideIndex;

      return newSlideIndex;
    }

    if (direction === 'backward') {
      const nextSlideIndex = activeSlideIndex - 1;
      const isOnStart = nextSlideIndex < 0;
      const newSlideIndex = isOnStart ? lastSlideIndex : nextSlideIndex;

      return newSlideIndex;
    }

    return activeSlideIndex;
  }

  updateActiveSlideIndex = (newActiveSlideIndex, direction) => {
    const { activeSlideIndex, onRequestChange } = this.props;

    this.enableItemsListTransition();

    if (newActiveSlideIndex !== activeSlideIndex) {
      this.stopAutoplay();

      this.direction = direction;
      onRequestChange(newActiveSlideIndex);
    }
  }

  startAutoplay = () => {
    const {
      autoplay, autoplayDirection, delay,
    } = this.props;

    if (autoplay) {
      this.autoplayTimer = setTimeout(() => {
        this.updateActiveSlideIndex(this.getNextSlideIndex(autoplayDirection), autoplayDirection);
      }, delay);
    }
  }

  stopAutoplay = () => {
    clearTimeout(this.autoplayTimer);
  }

  handleInitializationEnd = () => {
    this.setState(() => ({
      isInitialized: true,
    }), this.startAutoplay);
  };

  handleWindowResize = () => {
    clearTimeout(this.resizeTimer);

    this.resizeTimer = setTimeout(this.handleInitializationEnd, 400);
  };

  handleBackwardBtnClick = () => {
    this.updateActiveSlideIndex(this.getNextSlideIndex('backward'), 'backward');
  }

  handleForwardBtnClick = () => {
    this.updateActiveSlideIndex(this.getNextSlideIndex('forward'), 'forward');
  }

  handleItemsListTransitionEnd = () => {
    const { activeSlideIndex, onAfterChange } = this.props;

    this.setState(() => ({
      positionIndex: activeSlideIndex,
    }), () => {
      const { positionIndex } = this.state;

      this.itemsListDragStartPos = null;
      this.isListDragging = false;

      this.startAutoplay();

      onAfterChange(activeSlideIndex, positionIndex);
    });
  }

  updateItemsListPosByDragPos = (dragPos) => {
    const dragPosDiff = (this.itemsListDragStartPos - dragPos)
    + (this.itemsListRef.current.offsetWidth / 3);
    const minDragPos = 0;
    const maxDragPos = this.itemsListRef.current.offsetWidth - this.innerRef.current.offsetWidth;
    const itemsListPos = Math.max(Math.min(minDragPos, -dragPosDiff), -maxDragPos);

    this.disableItemsListTransition();

    this.itemsListRef.current.style.transform = `translateX(${itemsListPos}px)`;
  }

  handleItemsListDragEnd = (dragPos) => {
    const { activeSlideIndex } = this.props;
    const mousePosDiff = this.itemsListDragStartPos - dragPos;
    const activeItemHalfWidth = this.slides[activeSlideIndex].offsetWidth / 2;

    console.log({
      dragPos,
      itemsListDragStartPos: this.itemsListDragStartPos,
      mousePosDiff,
    });


    if (mousePosDiff > activeItemHalfWidth) {
      this.updateActiveSlideIndex(this.getNextSlideIndex('forward'), 'forward');
    } else if (mousePosDiff < -activeItemHalfWidth) {
      this.updateActiveSlideIndex(this.getNextSlideIndex('backward'), 'backward');
    } else {
      this.updateActiveSlideIndex(activeSlideIndex, 'forward');
    }
  }

  handleItemsListMouseMove = (event) => {
    this.isListDragging = true;

    this.updateItemsListPosByDragPos(event.clientX);
  }

  handleItemsListMouseUp = (event) => {
    document.removeEventListener('mousemove', this.handleItemsListMouseMove);
    document.removeEventListener('mouseup', this.handleItemsListMouseUp);

    if (this.isListDragging) {
      this.handleItemsListDragEnd(event.clientX);
    }
  }

  handleItemsListMouseDown = (event) => {
    this.stopAutoplay();

    this.itemsListDragStartPos = event.clientX;

    document.addEventListener('mousemove', this.handleItemsListMouseMove);
    document.addEventListener('mouseup', this.handleItemsListMouseUp);
  };

  handleItemsListTouchMove = (event) => {
    this.isListDragging = true;
    this.updateItemsListPosByDragPos(event.touches[0].clientX);
  };

  handleItemsListTouchEnd = (event) => {
    document.removeEventListener('touchmove', this.handleItemsListTouchMove);
    document.removeEventListener('touchend', this.handleItemsListTouchEnd);

    if (this.isListDragging) {
      this.handleItemsListDragEnd(event.changedTouches[event.changedTouches.length - 1].clientX);
    }
  };

  handleItemsListTouchStart = (event) => {
    this.stopAutoplay();

    this.itemsListDragStartPos = event.touches[0].clientX;

    document.addEventListener('touchmove', this.handleItemsListTouchMove);
    document.addEventListener('touchend', this.handleItemsListTouchEnd);
  };

  renderSlidesItems = (items, startIndex = 0, direction) => {
    const {
      updateOnItemClick,
      activeSlideIndex,
      activeSlideProps: {
        className: activeSlideClassName = '',
        style: activeSlideStyle = {},
        ...activeSlideProps
      },
    } = this.props;

    return (
      items.map((
        {
          props: {
            className: itemClassName = '',
            style: itemStyle = {},
            onClick: itemOnClick,
            ...itemComponentProps
          } = {},
          ...slideComponentData
        },
        index,
      ) => {
        const isActive = index + startIndex === activeSlideIndex;

        const className = `${itemClassName} ${isActive ? activeSlideClassName : ''}`;
        const style = {
          ...itemStyle,
          ...(isActive ? activeSlideStyle : {}),
          boxSizing: 'border-box',
          margin: 0,
        };
        const onClick = updateOnItemClick
          ? this.getSlideItemOnClick(index + startIndex, direction, itemOnClick)
          : itemOnClick;
        const props = {
          className,
          style,
          onClick,
          ...itemComponentProps,
          ...(isActive ? activeSlideProps : {}),
        };

        return {
          props: {
            role: 'tabpanel',
            ...props,
          },
          ...slideComponentData,
          ref: (node) => {
            if (node) {
              this.slides[index + startIndex] = node;
            }
          },
        };
      })
    );
  }

  render() {
    const {
      activeSlideIndex,
      speed,
      delay,
      easing,
      children,
      containerProps: {
        className: containerClassName = '',
        onClickCapture: containerOnClickCapture = null,
        ...containerProps
      },
      innerProps: {
        className: innerClassName = '',
        ...innerProps
      },
      itemsListProps: {
        className: itemsListClassName = '',
        style: itemsListStyle = {},
        onTouchStart: onItemsListTouchStart,
        onMouseDown: onItemsListMouseDown,
        onTransitionEnd: onItemsListTransitionEnd,
        ...itemsListProps
      },
      forwardBtnProps: {
        children: forwardBtnChildren = null,
        show: showForwardBtn = true,
        ...forwardBtnProps
      },
      backwardBtnProps: {
        children: backwardBtnChildren = null,
        show: showBackwardBtn = true,
        ...backwardBtnProps
      },
    } = this.props;

    const { isInitialized, positionIndex } = this.state;

    const isNewSLideIndex = (activeSlideIndex - positionIndex) !== 0;

    const positionIndexOffset = isInitialized && isNewSLideIndex
      ? this.getItemsListOffsetBySlideIndex(positionIndex)
      : 0;
    const activeSlideIndexOffset = isInitialized && isNewSLideIndex
      ? this.getItemsListOffsetBySlideIndex(activeSlideIndex)
      : 0;

    const itemsListTransition = !isNewSLideIndex || !(speed || delay)
      ? null
      : `transform ${speed}ms ${easing} ${delay}ms`;
    const itemsListTransform = isInitialized
      ? `translateX(-${(activeSlideIndexOffset - positionIndexOffset + this.getOffsetCorrectionForEdgeSlides(activeSlideIndex, positionIndex)) + this.itemsListRef.current.offsetWidth / 3}px)`
      : null;

    const slidesItems = Children.toArray(children);

    this.slides = [];

    return (
      <div
        className={`${styles.ReactJSSimpleCarousel} ${containerClassName}`}
        onClickCapture={(event) => {
          if (this.isListDragging) {
            event.preventDefault();
            event.stopPropagation();

            if (containerOnClickCapture) {
              containerOnClickCapture(event);
            }
          }
        }}
        {...containerProps}
        ref={this.containerRef}
      >
        {showBackwardBtn && (
          <button
            {...backwardBtnProps}
            type="button"
            onClick={this.handleBackwardBtnClick}
          >
            {backwardBtnChildren}
          </button>
        )}

        <div
          className={`${styles.ReactJSSimpleCarousel__inner} ${innerClassName}`}
          {...innerProps}
          ref={this.innerRef}
        >
          <div
            className={`${styles.ReactJSSimpleCarousel__itemsList} ${itemsListClassName}`}
            style={{
              ...itemsListStyle,
              transition: itemsListTransition,
              transform: itemsListTransform,
            }}
            onTouchStart={this.handleItemsListTouchStart}
            onMouseDown={this.handleItemsListMouseDown}
            onTransitionEnd={this.handleItemsListTransitionEnd}
            tabIndex="-1"
            role="presentation"
            {...itemsListProps}
            ref={this.itemsListRef}
          >

            {this.renderSlidesItems(slidesItems.slice(positionIndex), positionIndex, 'backward')}
            {this.renderSlidesItems(slidesItems, 0)}
            {this.renderSlidesItems(slidesItems, 0, 'forward')}
            {this.renderSlidesItems(slidesItems.slice(0, positionIndex), 0, 'forward')}

          </div>
        </div>

        {showForwardBtn && (
          <button
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

export default ReactJSSimpleCarousel;
