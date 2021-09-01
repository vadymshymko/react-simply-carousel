import React, {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Children,
} from "react";
import PropTypes from "prop-types";

function ReactSimplyCarousel({ responsiveProps, ...props }) {
  const [windowWidth, setWindowWidth] = useState(0);
  // eslint-disable-next-line react/destructuring-assignment
  const [positionIndex, setPositionIndex] = useState(props.activeSlideIndex);

  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const itemsListRef = useRef(null);

  const itemsListDragStartPosRef = useRef(null);
  const isListDraggingRef = useRef(false);

  const directionRef = useRef("");

  const autoplayTimerRef = useRef(null);
  const resizeTimerRef = useRef(null);

  const renderedSlidesCountRef = useRef(0);

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
    props
  );

  const slidesItems = Children.toArray(propsByWindowWidth.children);

  const {
    containerProps: {
      style: containerStyle,
      onClickCapture: containerOnClickCapture,
      ...containerProps
    },

    innerProps: { style: innerStyle, ...innerProps },
    itemsListProps: {
      style: itemsListStyle,
      onTouchStart: onItemsListTouchStart,
      onMouseDown: onItemsListMouseDown,
      onTransitionEnd: onItemsListTransitionEnd,
      ...itemsListProps
    },
    backwardBtnProps: {
      children: backwardBtnChildren = null,
      show: showBackwardBtn = true,
      ...backwardBtnProps
    },
    forwardBtnProps: {
      children: forwardBtnChildren = null,
      show: showForwardBtn = true,
      ...forwardBtnProps
    },
    activeSlideProps: {
      className: activeSlideClassName = "",
      style: activeSlideStyle = {},
      ...activeSlideProps
    },
    updateOnItemClick,
    activeSlideIndex,
    onRequestChange,
    speed,
    delay,
    easing,
    itemsToShow,
    itemsToScroll,
    children,
    onAfterChange,
    autoplay,
    autoplayDirection,
    disableNavIfAllVisible,
    hideNavIfAllVisible,
    centerMode,
    infinite,
    disableNavIfEdgeVisible,
    disableNavIfEdgeActive,
    dotsNav,
    dotsNavWrapperProps,
  } = windowWidth
    ? {
        ...propsByWindowWidth,
        activeSlideIndex: Math.max(
          0,
          Math.min(propsByWindowWidth.activeSlideIndex, slidesItems.length - 1)
        ),
        itemsToShow: Math.min(
          slidesItems.length,
          propsByWindowWidth.itemsToShow
        ),
        itemsToScroll: Math.min(
          slidesItems.length,
          propsByWindowWidth.itemsToScroll
        ),
      }
    : props;

  const {
    show: showDotsNav = false,
    activeClassName: activeDotClassName = "",
    ...dotsBtnProps
  } = dotsNav || {};

  const slides = useMemo(() => {
    if (!windowWidth) {
      return [];
    }

    if (infinite) {
      return [...itemsListRef.current.children].slice(
        slidesItems.length - positionIndex,
        slidesItems.length - positionIndex + slidesItems.length
      );
    }

    return [...itemsListRef.current.children];
  }, [positionIndex, slidesItems.length, windowWidth, infinite]);

  const itemsListMaxTranslateX = windowWidth
    ? itemsListRef.current.offsetWidth - innerRef.current.offsetWidth
    : 0;

  const getItemsListOffsetBySlideIndex = (slideIndex) => {
    const offsetByIndex = slides.reduce((total, item, index) => {
      if (index >= slideIndex) {
        return total;
      }

      return total + (item.offsetWidth || 0);
    }, 0);

    if (infinite) {
      return offsetByIndex;
    }

    return Math.min(itemsListMaxTranslateX, offsetByIndex);
  };

  const innerMaxWidth = useMemo(
    () =>
      !windowWidth || !itemsToShow
        ? null
        : slides.reduce((result, item, index) => {
            const isItemVisible =
              (index >= activeSlideIndex &&
                index < activeSlideIndex + itemsToShow) ||
              (index < activeSlideIndex &&
                index < activeSlideIndex + itemsToShow - slides.length);

            if (!isItemVisible) {
              return result;
            }

            return result + item.offsetWidth;
          }, 0),
    [activeSlideIndex, itemsToShow, slides, windowWidth]
  );

  const lastSlideIndex = Children.count(children) - 1;

  const isAllSlidesVisible = itemsToShow === slidesItems.length;

  const hideNav = hideNavIfAllVisible && isAllSlidesVisible;
  const disableNav = disableNavIfAllVisible && isAllSlidesVisible;

  const isNewSlideIndex = activeSlideIndex - positionIndex !== 0;

  const positionIndexOffset =
    windowWidth && isNewSlideIndex && infinite
      ? getItemsListOffsetBySlideIndex(positionIndex)
      : 0;
  const activeSlideIndexOffset =
    windowWidth && (isNewSlideIndex || !infinite)
      ? getItemsListOffsetBySlideIndex(activeSlideIndex)
      : 0;

  const activeSlideWidth = windowWidth
    ? slides[activeSlideIndex].offsetWidth
    : 0;

  const isCenterModeEnabled = centerMode && infinite;
  const offsetCorrectionForCenterMode =
    windowWidth && isCenterModeEnabled
      ? -(
          Math.min(
            innerMaxWidth || innerRef.current.offsetWidth,
            innerRef.current.offsetWidth
          ) - activeSlideWidth
        ) / 2
      : 0;

  const slidesWidth = useMemo(() => {
    if (infinite && windowWidth) {
      return itemsListRef.current.offsetWidth / 3;
    }

    return 0;
  }, [windowWidth, infinite]);

  const offsetCorrectionForEdgeSlides =
    // eslint-disable-next-line no-nested-ternary
    positionIndex - activeSlideIndex === 0 || !itemsListRef.current
      ? 0
      : // eslint-disable-next-line no-nested-ternary
      directionRef.current.toLowerCase() === "forward" &&
        activeSlideIndex < positionIndex
      ? slidesWidth
      : directionRef.current.toLowerCase() === "backward" &&
        activeSlideIndex > positionIndex
      ? -slidesWidth
      : 0;

  const itemsListTransition =
    !isNewSlideIndex || !(speed || delay)
      ? null
      : `transform ${speed}ms ${easing} ${delay}ms`;
  const itemsListTranslateX =
    disableNav || !windowWidth
      ? 0
      : activeSlideIndexOffset -
        positionIndexOffset +
        offsetCorrectionForCenterMode +
        offsetCorrectionForEdgeSlides +
        slidesWidth;
  const itemsListTransform = windowWidth
    ? `translateX(-${itemsListTranslateX}px)`
    : null;

  const getNextSlideIndex = useCallback(
    (direction) => {
      if (direction === "forward") {
        const nextSlideIndex = activeSlideIndex + itemsToScroll;
        const isOnEnd = nextSlideIndex > lastSlideIndex;
        // eslint-disable-next-line no-nested-ternary
        const newSlideIndex = isOnEnd
          ? infinite
            ? nextSlideIndex - lastSlideIndex - 1
            : activeSlideIndex
          : nextSlideIndex;

        return newSlideIndex;
      }

      if (direction === "backward") {
        const nextSlideIndex = activeSlideIndex - itemsToScroll;
        const isOnStart = nextSlideIndex < 0;
        // eslint-disable-next-line no-nested-ternary
        const newSlideIndex = isOnStart
          ? infinite
            ? lastSlideIndex + 1 + nextSlideIndex
            : activeSlideIndex
          : nextSlideIndex;

        return newSlideIndex;
      }

      return activeSlideIndex;
    },
    [activeSlideIndex, itemsToScroll, lastSlideIndex, infinite]
  );

  const updateActiveSlideIndex = useCallback(
    (newActiveSlideIndex, direction) => {
      directionRef.current = direction;
      itemsListRef.current.style.transition =
        speed || delay ? `transform ${speed}ms ${easing} ${delay}ms` : null;

      if (newActiveSlideIndex !== activeSlideIndex) {
        clearTimeout(autoplayTimerRef.current);
        onRequestChange(newActiveSlideIndex);
      } else {
        itemsListDragStartPosRef.current = null;
        isListDraggingRef.current = false;

        itemsListRef.current.style.transform = `translateX(-${
          offsetCorrectionForCenterMode +
          slidesWidth +
          (infinite ? 0 : itemsListTranslateX)
        }px)`;
      }
    },
    [
      activeSlideIndex,
      offsetCorrectionForCenterMode,
      delay,
      easing,
      speed,
      onRequestChange,
      slidesWidth,
      infinite,
      itemsListTranslateX,
    ]
  );

  const startAutoplay = useCallback(() => {
    if (autoplay) {
      clearTimeout(autoplayTimerRef.current);

      autoplayTimerRef.current = setTimeout(() => {
        updateActiveSlideIndex(
          getNextSlideIndex(autoplayDirection),
          autoplayDirection
        );
      }, delay);
    }
  }, [
    autoplay,
    autoplayDirection,
    updateActiveSlideIndex,
    getNextSlideIndex,
    delay,
  ]);

  const handleContainerClickCapture = useCallback(
    (event) => {
      if (isListDraggingRef.current) {
        event.preventDefault();
        event.stopPropagation();

        if (containerOnClickCapture) {
          containerOnClickCapture(event);
        }
      }
    },
    [containerOnClickCapture]
  );

  const handleBackwardBtnClick = useCallback(() => {
    updateActiveSlideIndex(getNextSlideIndex("backward"), "backward");
  }, [updateActiveSlideIndex, getNextSlideIndex]);

  const handleItemsListDrag = useCallback(
    (event) => {
      isListDraggingRef.current = true;

      const dragPos =
        event.touches && event.touches[0]
          ? event.touches[0].clientX
          : event.clientX;

      const dragPosDiff =
        itemsListDragStartPosRef.current -
        dragPos +
        offsetCorrectionForCenterMode +
        slidesWidth +
        (infinite ? 0 : itemsListTranslateX);
      const minDragPos = 0;
      const maxDragPos =
        itemsListRef.current.offsetWidth - innerRef.current.offsetWidth;
      const itemsListPos = Math.max(
        Math.min(minDragPos, -dragPosDiff),
        -maxDragPos
      );
      itemsListRef.current.style.transition = null;
      itemsListRef.current.style.transform = `translateX(${itemsListPos}px)`;
    },
    [offsetCorrectionForCenterMode, slidesWidth, infinite, itemsListTranslateX]
  );

  const handleItemsListDragEnd = useCallback(
    (event) => {
      itemsListRef.current.removeEventListener(
        "mouseout",
        handleItemsListDragEnd
      );
      itemsListRef.current.removeEventListener(
        "dragstart",
        handleItemsListDragEnd
      );

      document.removeEventListener("mousemove", handleItemsListDrag);
      document.removeEventListener("mouseup", handleItemsListDragEnd);

      document.removeEventListener("touchmove", handleItemsListDrag);
      document.removeEventListener("touchend", handleItemsListDragEnd);

      if (isListDraggingRef.current) {
        const dragPos =
          event.changedTouches && event.changedTouches.length
            ? event.changedTouches[event.changedTouches.length - 1].clientX
            : event.clientX;

        const mousePosDiff = itemsListDragStartPosRef.current - dragPos;

        if (mousePosDiff > activeSlideWidth / 2) {
          updateActiveSlideIndex(getNextSlideIndex("forward"), "forward");
        } else if (mousePosDiff < -activeSlideWidth / 2) {
          updateActiveSlideIndex(getNextSlideIndex("backward"), "backward");
        } else {
          updateActiveSlideIndex(activeSlideIndex, "forward");
        }
      }
    },
    [
      activeSlideIndex,
      activeSlideWidth,
      updateActiveSlideIndex,
      getNextSlideIndex,
      handleItemsListDrag,
    ]
  );

  const handleItemsListMouseDown = useCallback(
    (event) => {
      clearTimeout(autoplayTimerRef.current);

      if (!isListDraggingRef.current) {
        itemsListDragStartPosRef.current = event.clientX;

        document.addEventListener("mousemove", handleItemsListDrag);
        document.addEventListener("mouseup", handleItemsListDragEnd);

        itemsListRef.current.addEventListener(
          "mouseout",
          handleItemsListDragEnd
        );
        itemsListRef.current.addEventListener(
          "dragstart",
          handleItemsListDragEnd
        );
      }
    },
    [handleItemsListDrag, handleItemsListDragEnd]
  );

  const handleItemsListTouchStart = useCallback(
    (event) => {
      clearTimeout(autoplayTimerRef.current);

      if (!isListDraggingRef.current) {
        itemsListDragStartPosRef.current = event.touches[0].clientX;

        document.addEventListener("touchmove", handleItemsListDrag);
        document.addEventListener("touchend", handleItemsListDragEnd);
      }
    },
    [handleItemsListDrag, handleItemsListDragEnd]
  );

  const handleItemsListTransitionEnd = useCallback(() => {
    setPositionIndex(activeSlideIndex);
  }, [activeSlideIndex]);

  const handleForwardBtnClick = useCallback(() => {
    updateActiveSlideIndex(getNextSlideIndex("forward"), "forward");
  }, [updateActiveSlideIndex, getNextSlideIndex]);

  const getSlideItemOnClick = ({ direction, index, onClick }) => {
    const slideItemOnClick = (event) => {
      const forwardDirectionValue = activeSlideIndex < index ? "forward" : "";
      const backwardDirectionValue = activeSlideIndex > index ? "backward" : "";

      updateActiveSlideIndex(
        index,
        direction || forwardDirectionValue || backwardDirectionValue
      );

      if (onClick) {
        onClick(event);
      }
    };

    return slideItemOnClick;
  };

  const renderSlidesItems = (items, startIndex, isDisableNav) =>
    items.map((item, index) => {
      const {
        props: {
          className: itemClassName = "",
          onClick: itemOnClick,
          style: itemStyle = {},
          ...itemComponentProps
        } = {},
        ...slideComponentData
      } = item;

      // eslint-disable-next-line no-nested-ternary
      const direction = infinite
        ? renderedSlidesCountRef.current >= slidesItems.length
          ? "forward"
          : "backward"
        : index >= activeSlideIndex
        ? "forward"
        : "backward";

      const isActive = index + startIndex === activeSlideIndex;

      const className = `${itemClassName} ${direction} ${
        isActive ? activeSlideClassName : ""
      }`;
      const style = {
        ...itemStyle,
        ...(isActive ? activeSlideStyle : {}),
        boxSizing: "border-box",
        margin: 0,
      };
      const onClick =
        !isDisableNav && updateOnItemClick
          ? getSlideItemOnClick({
              direction,
              index: index + startIndex,
              onClick: itemOnClick,
            })
          : itemOnClick;
      const slideProps = {
        role: "tabpanel",
        className,
        style,
        onClick,
        ...itemComponentProps,
        ...(isActive ? activeSlideProps : {}),
      };

      renderedSlidesCountRef.current += 1;

      return {
        props: slideProps,
        ...slideComponentData,
      };
    });

  useEffect(() => {
    itemsListDragStartPosRef.current = null;
    isListDraggingRef.current = false;
    directionRef.current = "";

    if (activeSlideIndex !== positionIndex) {
      if (!speed && !delay) {
        setPositionIndex(activeSlideIndex);
      }
    } else {
      if (onAfterChange) {
        onAfterChange(activeSlideIndex, positionIndex);
      }

      if (
        infinite ||
        (autoplayDirection === "forward" &&
          activeSlideIndex !== lastSlideIndex) ||
        (autoplayDirection === "backward" && activeSlideIndex !== 0)
      ) {
        startAutoplay();
      }
    }

    return () => {
      clearTimeout(autoplayTimerRef.current);
    };
  }, [
    positionIndex,
    activeSlideIndex,
    onAfterChange,
    speed,
    delay,
    startAutoplay,
    infinite,
    lastSlideIndex,
    autoplayDirection,
  ]);

  useEffect(() => {
    if (windowWidth) {
      startAutoplay();
    }

    return () => {
      clearTimeout(autoplayTimerRef.current);
    };
  }, [windowWidth]);

  useEffect(() => {
    const itemsListRefDOMElement = itemsListRef.current;

    function handleWindowResize() {
      clearTimeout(resizeTimerRef.current);
      clearTimeout(autoplayTimerRef.current);

      resizeTimerRef.current = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 400);
    }

    setWindowWidth(window.innerWidth);

    window.addEventListener("resize", handleWindowResize);

    return () => {
      clearTimeout(resizeTimerRef.current);
      window.removeEventListener("resize", handleWindowResize);

      document.removeEventListener("mousemove", handleItemsListDrag);
      document.removeEventListener("mouseup", handleItemsListDragEnd);
      document.removeEventListener("touchmove", handleItemsListDrag);
      document.removeEventListener("touchend", handleItemsListDragEnd);

      itemsListRefDOMElement.removeEventListener(
        "mouseout",
        handleItemsListDragEnd
      );
      itemsListRefDOMElement.removeEventListener(
        "dragstart",
        handleItemsListDragEnd
      );
    };
  }, [handleItemsListDrag, handleItemsListDragEnd]);

  renderedSlidesCountRef.current = 0;

  if (windowWidth) {
    itemsListRef.current.style.transform = itemsListTransform;
  }

  return (
    <div
      onClickCapture={handleContainerClickCapture}
      style={{
        display: "flex",
        boxSizing: "border-box",
        justifyContent: "center",
        ...(containerStyle || {}),
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...containerProps}
      ref={containerRef}
    >
      {showBackwardBtn && !hideNav && (
        <button
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...backwardBtnProps}
          type="button"
          onClick={
            ((itemsListTranslateX === 0 && disableNavIfEdgeVisible) ||
              (activeSlideIndex === 0 && disableNavIfEdgeActive)) &&
            !infinite
              ? null
              : handleBackwardBtnClick
          }
          disabled={
            typeof backwardBtnProps.disabled === "boolean"
              ? backwardBtnProps.disabled
              : !!(
                  ((itemsListTranslateX === 0 && disableNavIfEdgeVisible) ||
                    (activeSlideIndex === 0 && disableNavIfEdgeActive)) &&
                  !infinite
                )
          }
        >
          {backwardBtnChildren}
        </button>
      )}

      <div
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...innerProps}
        style={{
          ...(innerStyle || {}),
          display: "flex",
          boxSizing: "border-box",
          flexFlow: "row wrap",
          padding: "0",
          overflow: "hidden",
          maxWidth: innerMaxWidth ? `${innerMaxWidth}px` : "100%",
        }}
        ref={innerRef}
      >
        {/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
        <div
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...itemsListProps}
          style={{
            ...(itemsListStyle || {}),
            display: "flex",
            boxSizing: "border-box",
            outline: "none",
            transition: itemsListTransition,
            transform: itemsListTransform,
          }}
          data-transform={itemsListTransform}
          onTouchStart={!disableNav ? handleItemsListTouchStart : null}
          onMouseDown={!disableNav ? handleItemsListMouseDown : null}
          onTransitionEnd={speed || delay ? handleItemsListTransitionEnd : null}
          tabIndex="-1"
          role="presentation"
          ref={itemsListRef}
        >
          {!disableNav &&
            infinite &&
            renderSlidesItems(slidesItems.slice(positionIndex), positionIndex)}
          {renderSlidesItems(slidesItems, 0, disableNav)}
          {!disableNav && infinite && renderSlidesItems(slidesItems, 0)}
          {!disableNav &&
            infinite &&
            renderSlidesItems(slidesItems.slice(0, positionIndex), 0)}
        </div>
      </div>

      {showForwardBtn && !hideNav && (
        <button
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...forwardBtnProps}
          type="button"
          onClick={
            ((itemsListTranslateX === itemsListMaxTranslateX &&
              disableNavIfEdgeVisible) ||
              (activeSlideIndex === lastSlideIndex &&
                disableNavIfEdgeActive)) &&
            !infinite
              ? null
              : handleForwardBtnClick
          }
          disabled={
            typeof forwardBtnProps.disabled === "boolean"
              ? forwardBtnProps.disabled
              : !!(
                  ((itemsListTranslateX === itemsListMaxTranslateX &&
                    disableNavIfEdgeVisible) ||
                    (activeSlideIndex === lastSlideIndex &&
                      disableNavIfEdgeActive)) &&
                  !infinite
                )
          }
        >
          {forwardBtnChildren}
        </button>
      )}

      {!infinite && !!showDotsNav && (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <div {...dotsNavWrapperProps}>
          {Array.from({
            length: Math.ceil(slidesItems.length / itemsToScroll),
          }).map((_item, index) => (
            <button
              type="button"
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              title={index}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...dotsBtnProps}
              className={`${dotsBtnProps.className || ""} ${
                index * itemsToScroll === activeSlideIndex
                  ? activeDotClassName
                  : ""
              }`}
              onClick={() => {
                updateActiveSlideIndex(
                  Math.min(index * itemsToScroll, slidesItems.length - 1),
                  Math.min(index * itemsToScroll, slidesItems.length - 1) >
                    activeSlideIndex
                    ? "forward"
                    : "backward"
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

ReactSimplyCarousel.propTypes = {
  activeSlideIndex: PropTypes.number.isRequired,
  activeSlideProps: PropTypes.objectOf(PropTypes.any),
  autoplay: PropTypes.bool,
  autoplayDirection: PropTypes.oneOf(["forward", "backward"]),
  backwardBtnProps: PropTypes.objectOf(PropTypes.any),
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
  centerMode: PropTypes.bool,
  infinite: PropTypes.bool,
  disableNavIfEdgeVisible: PropTypes.bool,
  disableNavIfEdgeActive: PropTypes.bool,
  dotsNav: PropTypes.objectOf(PropTypes.any),
  dotsNavWrapperProps: PropTypes.objectOf(PropTypes.any),
};

ReactSimplyCarousel.defaultProps = {
  activeSlideProps: {},
  autoplay: false,
  autoplayDirection: "forward",
  backwardBtnProps: {},
  children: null,
  containerProps: {},
  delay: 0,
  disableNavIfAllVisible: true,
  easing: "linear",
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
  centerMode: false,
  infinite: true,
  disableNavIfEdgeVisible: true,
  disableNavIfEdgeActive: true,
  dotsNav: {},
  dotsNavWrapperProps: {},
};

export default memo(ReactSimplyCarousel);
