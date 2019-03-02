import React, { Component, Children, createRef } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.scss';

class ReactJSSimpleCarousel extends Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    prevBtn: PropTypes.shape({
      show: PropTypes.bool,
      className: PropTypes.string,
      children: PropTypes.node,
      disableOnEnd: PropTypes.bool,
    }),
    nextBtn: PropTypes.shape({
      show: PropTypes.bool,
      className: PropTypes.string,
      children: PropTypes.node,
      disableOnEnd: PropTypes.bool,
    }),
    inner: PropTypes.shape({
      className: PropTypes.string,
    }),
    itemsList: PropTypes.shape({
      className: PropTypes.string,
      style: PropTypes.object,
    }),
    item: PropTypes.shape({
      activeClassName: PropTypes.string,
      activeStyle: PropTypes.object,
    }),
    dotsNav: PropTypes.shape({
      show: PropTypes.bool,
      className: PropTypes.string,
      item: PropTypes.shape({
        className: PropTypes.string,
        activeClassName: PropTypes.string,
      }),
      disableActiveItem: PropTypes.bool,
    }),
    itemsToShow: PropTypes.number,
    speed: PropTypes.number,
    delay: PropTypes.number,
    easing: PropTypes.string,
    autoplay: PropTypes.bool,
    autoplayDirection: PropTypes.oneOf([
      'left',
      'right',
    ]),
    activeSlideIndex: PropTypes.number,
    onRequestChange: PropTypes.func,
  }

  static defaultProps = {
    children: null,
    className: '',
    prevBtn: {},
    nextBtn: {},
    inner: {
      className: '',
    },
    itemsList: {
      className: '',
      style: {},
    },
    item: {
      activeClassName: '',
      activeStyle: {},
    },
    dotsNav: {},
    itemsToShow: null,
    speed: 0,
    delay: 0,
    easing: 'linear',
    autoplay: false,
    autoplayDirection: 'right',
    onRequestChange: () => {},
    activeSlideIndex: 0,
  }

  constructor(props) {
    super(props);

    this.slides = [];

    this.itemsListPosition = 0;
    this.itemsListTransition = null;
    this.isItemsListTransitionDisabled = false;

    this.resizeTimer = null;

    this.isSlideMoving = false;
    this.slideMovingStartMouseXPos = null;

    this.containerRef = createRef();
    this.innerRef = createRef();
    this.itemsListRef = createRef();
  }

  state = {
    isInitialized: false,
  }

  componentDidMount() {
    this.handleInitializationEnd();

    window.addEventListener('resize', this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);

    document.removeEventListener('mousemove', this.handleDocumentMouseMove);
    document.removeEventListener('mouseup', this.handleItemsListMoveEnd);
    document.removeEventListener('touchmove', this.handleDocumentTouchMove);
    document.removeEventListener('touchend', this.handleItemsListMoveEnd);
  }

  getLastSlideIndex = () => {
    const {
      children,
    } = this.props;

    return Children.count(children) - 1;
  }

  getValidatedSlideIndex = slideIndex => (
    Math.max(
      0,
      Math.min(
        slideIndex,
        this.getLastSlideIndex(),
      ),
    )
  )

  getItemsListOffsetBySlideIndex = (slideIndex) => {
    const offsetByIndex = this.slides.reduce((
      total,
      item = {},
      index,
    ) => {
      if (index >= slideIndex) {
        return total;
      }

      return total + (item.offsetWidth || 0);
    }, 0);

    const maxOffset = this.getMaxItemsListOffset();

    return Math.max(
      0,
      Math.min(
        offsetByIndex,
        maxOffset,
      ),
    );
  }

  getItemsListOffsetByMousePos = (mousePos) => {
    const {
      activeSlideIndex,
    } = this.props;

    const itemsListOffsetByActiveSlideIndex = this.getItemsListOffsetBySlideIndex(activeSlideIndex);
    const itemsListOffsetByMousePos = (
      (mousePos - this.slideMovingStartMouseXPos) - itemsListOffsetByActiveSlideIndex
    );
    const maxItemsListOffset = this.getMaxItemsListOffset();

    return Math.max(
      Math.min(0, itemsListOffsetByMousePos),
      (-maxItemsListOffset),
    );
  }

  getMaxItemsListOffset = () => {
    if (this.itemsListRef.current && this.innerRef.current) {
      return Math.max(
        0,
        this.itemsListRef.current.offsetWidth - this.innerRef.current.offsetWidth,
      );
    }

    return 0;
  }

  getSlideIndexByListOffset = (listOffset) => {
    const {
      activeSlideIndex,
    } = this.props;

    const slideIndex = this.slides.reduce((result, item, index) => {
      const itemOffset = -(this.getItemsListOffsetBySlideIndex(index));
      const itemStartPos = itemOffset + (item.offsetWidth / 2);
      const itemEndPos = itemOffset - (item.offsetWidth / 2);

      if (listOffset <= itemStartPos && listOffset >= itemEndPos) {
        return index;
      }

      return result;
    }, activeSlideIndex);

    return this.getValidatedSlideIndex(slideIndex);
  }

  getAutoplayNextSlideIndex = () => {
    const {
      autoplayDirection,
      activeSlideIndex,
    } = this.props;

    if (autoplayDirection === 'left') {
      return activeSlideIndex - 1;
    }

    return activeSlideIndex + 1;
  }

  handleInitializationEnd = () => {
    const {
      autoplay,
    } = this.props;

    this.setState(() => ({
      isInitialized: true,
    }), () => {
      if (autoplay) {
        this.startAutoplay();
      }
    });
  }

  handleListMouseDown = (event) => {
    event.preventDefault();

    this.slideMovingStartMouseXPos = event.clientX;

    this.disableItemsListTransition();

    document.addEventListener('mousemove', this.handleDocumentMouseMove);
    document.addEventListener('mouseup', this.handleItemsListMouseUp);
  }

  handleDocumentMouseMove = (event) => {
    event.preventDefault();

    this.isSlideMoving = true;

    this.handleItemsListMove(event.clientX);
  }

  handleItemsListMouseUp = (event) => {
    event.preventDefault();

    document.removeEventListener('mousemove', this.handleDocumentMouseMove);
    document.removeEventListener('mouseup', this.handleItemsListMouseUp);

    if (this.isSlideMoving) {
      if (
        !(
          event.target === this.containerRef.current
          || this.containerRef.current.contains(event.target)
        )
      ) {
        this.isSlideMoving = false;
      }

      this.handleItemsListMoveEnd(event.clientX);
    }
  }

  handleListTouchStart = (event) => {
    event.preventDefault();

    this.slideMovingStartMouseXPos = event.touches[0].clientX;

    this.disableItemsListTransition();

    document.addEventListener('touchmove', this.handleDocumentTouchMove);
    document.addEventListener('touchend', this.handleItemsListTouchEnd);
  }

  handleDocumentTouchMove = (event) => {
    event.preventDefault();

    this.isSlideMoving = true;

    this.handleItemsListMove(event.touches[0].clientX);
  }

  handleItemsListTouchEnd = (event) => {
    event.preventDefault();

    document.removeEventListener('touchmove', this.handleDocumentTouchMove);
    document.removeEventListener('touchend', this.handleItemsListMoveEnd);

    if (this.isSlideMoving) {
      if (
        !(
          event.target === this.containerRef.current
          || this.containerRef.current.contains(event.target)
        )
      ) {
        this.isSlideMoving = false;
      }

      this.handleItemsListMoveEnd(event.touches[0].clientX);
    }
  }

  handleItemsListMove = (mousePos) => {
    const {
      autoplay,
    } = this.props;

    const newItemsListOffset = this.getItemsListOffsetByMousePos(mousePos);

    if (autoplay) {
      clearTimeout(this.autoplayTimer);
    }

    this.itemsListPosition = newItemsListOffset;
    this.itemsListRef.current.style.transform = `translateX(${newItemsListOffset}px)`;
  }

  handleItemsListMoveEnd = (mousePos) => {
    const newItemsListOffset = this.getItemsListOffsetByMousePos(mousePos);
    const slideIndexByListOffset = this.getSlideIndexByListOffset(newItemsListOffset);

    this.slideMovingStartMouseXPos = null;

    this.enableItemsListTransition();

    this.goToSlide(slideIndexByListOffset);
  }

  handleContainerClick = (event) => {
    if (this.isSlideMoving) {
      this.isSlideMoving = false;

      event.preventDefault();
      event.stopPropagation();
    }
  }

  handleWindowResize = () => {
    clearTimeout(this.resizeTimer);

    this.resizeTimer = setTimeout(this.handleInitializationEnd, 400);
  }

  handlePrevBtnClick = () => {
    const {
      autoplay,
      activeSlideIndex,
    } = this.props;

    if (autoplay) {
      clearTimeout(this.autoplayTimer);
    }

    this.goToSlide(activeSlideIndex - 1);
  }

  handleNextBtnClick = () => {
    const {
      autoplay,
      activeSlideIndex,
    } = this.props;

    if (autoplay) {
      clearTimeout(this.autoplayTimer);
    }

    this.goToSlide(activeSlideIndex + 1);
  }

  goToSlide = (slideIndex) => {
    const {
      activeSlideIndex,
      autoplay,
      speed,
      delay,
      onRequestChange,
    } = this.props;

    const lastSlideIndex = this.getLastSlideIndex();
    const validatedSlideIndex = this.getValidatedSlideIndex(slideIndex);

    if (validatedSlideIndex !== activeSlideIndex) {
      onRequestChange(validatedSlideIndex);

      if (autoplay && validatedSlideIndex !== lastSlideIndex) {
        this.autoplayTimer = setTimeout(() => {
          this.goToSlide(this.getAutoplayNextSlideIndex());
        }, speed + delay);
      } else if (autoplay) {
        clearTimeout(this.autoplayTimer);
      }
    } else {
      this.itemsListPosition = -this.getItemsListOffsetBySlideIndex(validatedSlideIndex);
      this.itemsListRef.current.style.transform = `translateX(${-this.getItemsListOffsetBySlideIndex(validatedSlideIndex)}px)`;
    }
  }

  disableItemsListTransition = () => {
    if (!this.isItemsListTransitionDisabled) {
      this.itemsListTransition = this.itemsListRef.current.style.transition || null;
      this.itemsListRef.current.style.transition = 'none';

      this.isItemsListTransitionDisabled = true;
    }
  }

  enableItemsListTransition = () => {
    if (this.isItemsListTransitionDisabled) {
      this.itemsListRef.current.style.transition = this.itemsListTransition;

      this.isItemsListTransitionDisabled = false;
    }
  }

  startAutoplay = () => {
    const {
      activeSlideIndex,
      autoplay,
      delay,
    } = this.props;

    if (autoplay && activeSlideIndex !== this.getLastSlideIndex()) {
      this.autoplayTimer = setTimeout(() => {
        this.goToSlide(this.getAutoplayNextSlideIndex());
      }, delay);
    }
  }

  renderNavBtn = ({ children, ...props }) => (
    <button {...props} type="button">
      {children}
    </button>
  )

  render() {
    const {
      className,
      prevBtn: {
        show: showPrevBtn = false,
        className: prevBtnClassName = '',
        children: prevBtnChildren = null,
        disableOnEnd: disablePrevBtnOnEnd,
        ...prevBtnProps
      } = {},
      nextBtn: {
        show: showNextBtn = false,
        className: nextBtnClassName = '',
        children: nextBtnChildren = null,
        disableOnEnd: disableNextBtnOnEnd,
        ...nextBtnProps
      } = {},
      inner: {
        className: innerClassName = '',
        ...innerProps
      },
      itemsList: {
        className: listClassName,
        style: {
          minWidth: listMinWidth = null,
          width: listWidth = null,
          ...listStyle
        },
        ...itemsListProps
      },
      item: {
        activeClassName: activeItemClassName = '',
        activeStyle: activeItemStyle = {},
        ...itemProps
      },
      dotsNav: {
        show: showDotsNav = false,
        className: dotsNavClassName = '',
        disableActiveItem: disableActiveDotsNavItem = true,
        item: {
          activeClassName: dotsNavItemActiveClassName = '',
          className: dotsNavItemClassName = '',
          ...dotsNavItemProps
        } = {},
        ...dotsNavProps
      },
      itemsToShow,
      speed,
      delay,
      easing,
      children,
      onRequestChange,
      activeSlideIndex,
      autoplay,
      autoplayDirection,
      ...containerProps
    } = this.props;

    const { isInitialized } = this.state;

    const itemsCount = Children.count(children);
    const lastSlideIndex = this.getLastSlideIndex();
    const validatedActiveSlideIndex = this.getValidatedSlideIndex(activeSlideIndex);

    const itemsListOffset = isInitialized
      ? `-${this.getItemsListOffsetBySlideIndex(validatedActiveSlideIndex)}px`
      : this.itemsListPosition;

    const itemsListWidthByItemsToShow = itemsToShow
      ? `${(100 * itemsCount) / itemsToShow}%`
      : null;

    const itemWidthByItemsToShow = itemsToShow
      ? `${100 / itemsCount}%`
      : null;

    this.slides = [];

    return (
      <div
        className={`${styles.ReactJSSimpleCarousel || ''} ${className}`}
        {...containerProps}
        onClickCapture={this.handleContainerClick}
        ref={this.containerRef}
      >
        {showPrevBtn && (
          this.renderNavBtn({
            ...prevBtnProps,
            className: `
              ${styles.ReactJSSimpleCarousel__navBtn}
              ${styles['ReactJSSimpleCarousel__navBtn--type-prev']}
              ${prevBtnClassName}
            `,
            onClick: this.handlePrevBtnClick,
            disabled: disablePrevBtnOnEnd && activeSlideIndex === 0,
            children: prevBtnChildren,
          })
        )}

        <div
          className={`${styles.ReactJSSimpleCarousel__inner} ${innerClassName}`}
          {...innerProps}
          ref={this.innerRef}
        >
          <div
            className={`${styles.ReactJSSimpleCarousel__itemsList} ${listClassName}`}
            style={{
              ...listStyle,
              transition: (speed || delay)
                ? `transform ${speed}ms ${easing} ${delay}ms`
                : null,
              transform: `translateX(${itemsListOffset})`,
              minWidth: itemsListWidthByItemsToShow || listMinWidth,
              width: itemsListWidthByItemsToShow || listWidth,
            }}
            {...itemsListProps}
            onTouchStart={this.handleListTouchStart}
            onMouseDown={this.handleListMouseDown}
            tabIndex="-1"
            role="presentation"
            ref={this.itemsListRef}
          >

            {Children.map(children, ({
              props: {
                className: itemClassName = '',
                style: {
                  width: itemWidth = null,
                  ...itemStyle
                } = {},
                role,
                ...itemComponentProps
              } = {},
              ...slideComponentData
            }, index) => ({
              props: {
                className: `
                  ${styles.ReactJSSimpleCarousel__slide}
                  ${itemClassName}
                  ${index === activeSlideIndex
                  ? activeItemClassName
                  : ''
                  }
                `,
                style: {
                  ...itemStyle,
                  ...(index === activeSlideIndex
                    ? activeItemStyle
                    : {}
                  ),
                  margin: 0,
                  width: itemWidthByItemsToShow || itemWidth,
                },
                role: 'tabpanel',
                ...itemProps,
                ...itemComponentProps,
              },
              ...slideComponentData,
              ref: (node) => {
                if (node) {
                  this.slides = [
                    ...this.slides,
                    node,
                  ];
                }
              },
            }))}

          </div>

          {showDotsNav && (
            <div
              className={`${styles.ReactJSSimpleCarousel__dotsNav} ${dotsNavClassName}`}
              {...dotsNavProps}
              role="tablist"
            >

              {Array.from({ length: itemsCount }).map((item, index) => (
                this.renderNavBtn({
                  ...dotsNavItemProps,
                  className: `
                    ${styles.ReactJSSimpleCarousel__dotsNavItem}
                    ${dotsNavItemClassName}
                    ${index === activeSlideIndex
                    ? dotsNavItemActiveClassName
                    : ''
                    }
                  `,
                  onClick: () => {
                    this.goToSlide(index);
                  },
                  disabled: disableActiveDotsNavItem && index === activeSlideIndex,
                  children: nextBtnChildren,
                })
              ))}

            </div>
          )}
        </div>

        {showNextBtn && (
          this.renderNavBtn({
            ...nextBtnProps,
            className: `
              ${styles.ReactJSSimpleCarousel__navBtn}
              ${styles['ReactJSSimpleCarousel__navBtn--type-next']}
              ${nextBtnClassName}
            `,
            onClick: this.handleNextBtnClick,
            disabled: disableNextBtnOnEnd && activeSlideIndex === lastSlideIndex,
            children: nextBtnChildren,
          })
        )}
      </div>
    );
  }
}

export default ReactJSSimpleCarousel;
