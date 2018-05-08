import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

import styles from './ReactJSSimpleCarousel.scss';

class ReactJSSimpleCarousel extends Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    prevBtn: PropTypes.shape({
      show: PropTypes.bool,
      className: PropTypes.string,
      children: PropTypes.node,
    }),
    nextBtn: PropTypes.shape({
      show: PropTypes.bool,
      className: PropTypes.string,
      children: PropTypes.node,
    }),
    inner: PropTypes.shape({
      className: PropTypes.string,
    }),
    itemsList: PropTypes.shape({
      className: PropTypes.string,
      style: PropTypes.object,
    }),
    item: PropTypes.shape({
      className: PropTypes.string,
      activeClassName: PropTypes.string,
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
    activeSlideIndex: PropTypes.number,
    onRequestChange: PropTypes.func,
  }

  static defaultProps = {
    children: null,
    className: '',
    prevBtn: {
      show: false,
    },
    nextBtn: {
      show: false,
    },
    inner: {
      className: '',
    },
    itemsList: {
      className: '',
      style: {},
    },
    item: {
      className: '',
      activeClassName: '',
    },
    dotsNav: {
      show: false,
      disableActiveItem: true,
    },
    onRequestChange: () => {},
    activeSlideIndex: 0,
  }

  constructor(props) {
    super(props);

    this.slides = [];
    this.mouseXPos = null;

    this.resizeTimer = null;

    this.itemsListTransition = null;
    this.isItemsListTransitionDisabled = false;
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

  getValidatedSlideIndex = slideIndex => (
    Math.max(
      0,
      Math.min(
        slideIndex,
        Children.count(this.props.children) - 1,
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

  getMaxItemsListOffset = () => {
    if (this.itemsList && this.inner) {
      return (this.itemsList.offsetWidth - this.inner.offsetWidth);
    }

    return 0;
  }

  getItemsListOffsetFromDOM = () => {
    if (this.itemsList) {
      return this.itemsList.style.marginLeft;
    }

    return null;
  }

  getSlideIndexByListOffset = (listOffset) => {
    const {
      activeSlideIndex,
    } = this.props;

    const slideIndex = this.slides.reduce((prev, current, index) => {
      const offset = (-this.getItemsListOffsetBySlideIndex(index));

      if (Math.abs(offset - listOffset) < Math.abs(prev.offset - listOffset)) {
        return {
          offset,
          index,
        };
      }

      return prev;
    }, {
      index: activeSlideIndex,
      offset: (-this.getItemsListOffsetBySlideIndex(activeSlideIndex)),
    }).index;

    return this.getValidatedSlideIndex(slideIndex);
  }

  handleInitializationEnd = () => {
    this.setState(() => ({
      isInitialized: true,
    }));
  }

  handleListMouseDown = (event) => {
    this.disableItemsListTransition();

    this.mouseXPos = event.clientX;

    document.addEventListener('mousemove', this.handleDocumentMouseMove);
    document.addEventListener('mouseup', this.handleItemsListMoveEnd);
    document.addEventListener('dragstart', this.handleItemsListMoveEnd);
  }

  handleDocumentMouseMove = (event) => {
    this.handleItemsListMove(event.clientX);
  }

  handleListTouchStart = (event) => {
    this.disableItemsListTransition();

    this.mouseXPos = event.touches[0].clientX;

    document.addEventListener('touchmove', this.handleDocumentTouchMove);
    document.addEventListener('touchend', this.handleItemsListMoveEnd);
    document.addEventListener('dragstart', this.handleItemsListMoveEnd);
  }

  handleDocumentTouchMove = (event) => {
    this.handleItemsListMove(event.touches[0].clientX);
  }

  handleItemsListMove = (mousePos) => {
    const {
      activeSlideIndex,
    } = this.props;

    const currentItemsListOffset = this.getItemsListOffsetBySlideIndex(activeSlideIndex);
    const maxItemsListOffset = this.getMaxItemsListOffset();

    const nexwItemsListOffset = (-currentItemsListOffset) + (mousePos - this.mouseXPos);

    this.itemsList.style.marginLeft = `${Math.max(Math.min(0, nexwItemsListOffset), (-maxItemsListOffset))}px`;
  }

  handleItemsListMoveEnd = () => {
    const itemsListOffset = parseInt(this.itemsList.style.marginLeft, 10);
    const slideIndexByListOffset = this.getSlideIndexByListOffset(itemsListOffset);

    document.removeEventListener('mousemove', this.handleDocumentMouseMove);
    document.removeEventListener('mouseup', this.handleItemsListMoveEnd);
    document.removeEventListener('touchmove', this.handleDocumentTouchMove);
    document.removeEventListener('touchend', this.handleItemsListMoveEnd);

    this.mouseXPos = null;

    this.enableItemsListTransition();

    if (slideIndexByListOffset !== this.props.activeSlideIndex) {
      this.props.onRequestChange(slideIndexByListOffset);
    } else {
      this.itemsList.style.marginLeft = `-${this.getItemsListOffsetBySlideIndex(slideIndexByListOffset)}px`;
    }
  }

  handleWindowResize = () => {
    clearTimeout(this.resizeTimer);

    this.resizeTimer = setTimeout(this.handleInitializationEnd, 400);
  }

  handlePrevBtnClick = () => {
    this.goToSlide(this.props.activeSlideIndex - 1);
  }

  handleNextBtnClick = () => {
    this.goToSlide(this.props.activeSlideIndex + 1);
  }

  goToSlide = (slideIndex) => {
    const {
      activeSlideIndex,
    } = this.props;

    const validatedSlideIndex = this.getValidatedSlideIndex(slideIndex);

    const nextItemsListOffset = this.getItemsListOffsetBySlideIndex(validatedSlideIndex);
    const currentItemsListOffset = (
      this.getItemsListOffsetBySlideIndex(activeSlideIndex)
    );

    if (
      (validatedSlideIndex !== activeSlideIndex)
      && (nextItemsListOffset !== currentItemsListOffset)
    ) {
      this.props.onRequestChange(validatedSlideIndex);
    }
  }

  disableItemsListTransition = () => {
    if (!this.isItemsListTransitionDisabled) {
      this.itemsListTransition = this.itemsList.style.transition || null;
      this.itemsList.style.transition = 'none';

      this.isItemsListTransitionDisabled = true;
    }
  }

  enableItemsListTransition = () => {
    if (this.isItemsListTransitionDisabled) {
      this.itemsList.style.transition = this.itemsListTransition;

      this.isItemsListTransitionDisabled = false;
    }
  }

  render() {
    const {
      className,
      prevBtn: {
        show: showPrevBtn,
        className: prevBtnClassName = '',
        children: prevBtnChildren = null,
        ...prevBtnProps
      } = {},
      nextBtn: {
        show: showNextBtn,
        className: nextBtnClassName = '',
        children: nextBtnChildren = null,
        ...nextBtnProps
      } = {},
      inner: {
        className: innerClassName,
        ...innerProps
      },
      itemsList: {
        className: listClassName,
        style: listStyle,
        ...itemsListProps
      },
      item: {
        activeClassName: activeItemClassName = '',
        ...itemProps
      },
      dotsNav: {
        show: showDotsNav,
        className: dotsNavClassName = '',
        disableActiveItem: disableActiveDotsNavItem = true,
        item: {
          activeClassName: dotsNavItemActiveClassName = '',
          className: dotsNavItemClassName = '',
          ...dotsNavItemProps
        } = {},
        ...dotsNavProps
      },
      children,
      onRequestChange,
      activeSlideIndex,
      ...containerProps
    } = this.props;

    const validatedActiveSlideIndex = this.getValidatedSlideIndex(activeSlideIndex);

    const itemsListOffset = this.state.isInitialized
      ? `-${this.getItemsListOffsetBySlideIndex(validatedActiveSlideIndex)}px`
      : this.getItemsListOffsetFromDOM();

    this.slides = [];

    return (
      <div
        className={`${styles.ReactJSSimpleCarousel} ${className}`}
        {...containerProps}
        ref={(node) => { this.container = node; }}
      >
        {showPrevBtn && (
          <button
            className={`
              ${styles.ReactJSSimpleCarousel__navBtn}
              ${styles['ReactJSSimpleCarousel__navBtn--type-prev']}
              ${prevBtnClassName}
            `}
            onClick={this.handlePrevBtnClick}
            {...prevBtnProps}
          >
            {prevBtnChildren}
          </button>
        )}

        <div
          className={`${styles.ReactJSSimpleCarousel__inner} ${innerClassName}`}
          {...innerProps}
          ref={(node) => { this.inner = node; }}
        >
          <div
            className={`${styles.ReactJSSimpleCarousel__itemsList} ${listClassName}`}
            style={{
              ...listStyle,
              marginLeft: itemsListOffset,
            }}
            {...itemsListProps}
            onTouchStart={this.handleListTouchStart}
            onMouseDown={this.handleListMouseDown}
            tabIndex="-1"
            role="presentation"
            ref={(node) => { this.itemsList = node; }}
          >

            {Children.map(children, ({
              props: {
                className: itemClassName,
                role,
                ...itemComponentProps
              },
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
              ref={(node) => { this.dotsNav = node; }}
            >

              {Array.from({ length: Children.count(children) }).map((item, index) => (
                <button
                  className={`
                    ${styles.ReactJSSimpleCarousel__dotsNavItem}
                    ${dotsNavItemClassName}
                    ${index === activeSlideIndex
                      ? dotsNavItemActiveClassName
                      : ''
                    }
                  `}
                  type="button"
                  disabled={disableActiveDotsNavItem && index === activeSlideIndex}
                  {...dotsNavItemProps}
                  onClick={() => {
                    this.goToSlide(index);
                  }}
                />
              ))}

            </div>
          )}
        </div>

        {showNextBtn && (
          <button
            className={`
              ${styles.ReactJSSimpleCarousel__navBtn}
              ${styles['ReactJSSimpleCarousel__navBtn--type-next']}
              ${nextBtnClassName}
            `}
            onClick={this.handleNextBtnClick}
            {...nextBtnProps}
          >
            {nextBtnChildren}
          </button>
        )}
      </div>
    );
  }
}

export default ReactJSSimpleCarousel;
