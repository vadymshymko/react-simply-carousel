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

  const slides = useMemo(
    () =>
      windowWidth
        ? [...itemsListRef.current.children].slice(
            slidesItems.length - positionIndex,
            slidesItems.length - positionIndex + slidesItems.length
          )
        : [],
    [positionIndex, slidesItems.length, windowWidth]
  );

  const getOffsetCorrectionForEdgeSlides = useCallback(() => {
    if (positionIndex - activeSlideIndex === 0) {
      return 0;
    }

    if (
      directionRef.current.toLowerCase() === "forward" &&
      activeSlideIndex < positionIndex
    ) {
      return itemsListRef.current.offsetWidth / 3;
    }

    if (
      directionRef.current.toLowerCase() === "backward" &&
      activeSlideIndex > positionIndex
    ) {
      return -itemsListRef.current.offsetWidth / 3;
    }

    return 0;
  }, [activeSlideIndex, positionIndex]);

  const getItemsListOffsetBySlideIndex = (slideIndex) => {
    const offsetByIndex = slides.reduce((total, item, index) => {
      if (index >= slideIndex) {
        return total;
      }

      return total + (item.offsetWidth || 0);
    }, 0);

    return offsetByIndex;
  };

  const innerMaxWidth =
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
        }, 0);

  const lastSlideIndex = Children.count(children) - 1;

  const isAllSlidesVisible = itemsToShow === slidesItems.length;

  const hideNav = hideNavIfAllVisible && isAllSlidesVisible;
  const disableNav = disableNavIfAllVisible && isAllSlidesVisible;

  const isNewSLideIndex = activeSlideIndex - positionIndex !== 0;

  const positionIndexOffset =
    windowWidth && isNewSLideIndex
      ? getItemsListOffsetBySlideIndex(positionIndex)
      : 0;
  const activeSlideIndexOffset =
    windowWidth && isNewSLideIndex
      ? getItemsListOffsetBySlideIndex(activeSlideIndex)
      : 0;

  const activeSlideWidth = windowWidth
    ? slides[activeSlideIndex].offsetWidth
    : 0;

  const ofsetCorrectionForCenterMode =
    windowWidth && centerMode
      ? -(
          Math.min(
            innerMaxWidth || innerRef.current.offsetWidth,
            innerRef.current.offsetWidth
          ) - activeSlideWidth
        ) / 2
      : 0;

  const itemsListTransition =
    !isNewSLideIndex || !(speed || delay)
      ? null
      : `transform ${speed}ms ${easing} ${delay}ms`;
  const itemsListTranslateX =
    disableNav || !windowWidth
      ? 0
      : activeSlideIndexOffset -
        positionIndexOffset +
        ofsetCorrectionForCenterMode +
        getOffsetCorrectionForEdgeSlides() +
        itemsListRef.current.offsetWidth / 3;
  const itemsListTransform = windowWidth
    ? `translateX(-${itemsListTranslateX}px)`
    : null;

  const getNextSlideIndex = useCallback(
    (direction) => {
      if (direction === "forward") {
        const nextSlideIndex = activeSlideIndex + itemsToScroll;
        const isOnEnd = nextSlideIndex > lastSlideIndex;
        const newSlideIndex = isOnEnd
          ? nextSlideIndex - lastSlideIndex - 1
          : nextSlideIndex;

        return newSlideIndex;
      }

      if (direction === "backward") {
        const nextSlideIndex = activeSlideIndex - itemsToScroll;
        const isOnStart = nextSlideIndex < 0;
        const newSlideIndex = isOnStart
          ? lastSlideIndex + 1 + nextSlideIndex
          : nextSlideIndex;

        return newSlideIndex;
      }

      return activeSlideIndex;
    },
    [activeSlideIndex, itemsToScroll, lastSlideIndex]
  );

  const stopAutoplay = useCallback(() => {
    clearTimeout(autoplayTimerRef.current);
  }, []);

  const updatePositionIndex = useCallback(() => {
    setPositionIndex(activeSlideIndex);
  }, [activeSlideIndex]);

  const updateActiveSlideIndex = useCallback(
    (newActiveSlideIndex, direction) => {
      directionRef.current = direction;
      itemsListRef.current.style.transition =
        speed || delay ? `transform ${speed}ms ${easing} ${delay}ms` : null;

      if (newActiveSlideIndex !== activeSlideIndex) {
        stopAutoplay();
        onRequestChange(newActiveSlideIndex);
      } else {
        itemsListDragStartPosRef.current = null;
        isListDraggingRef.current = false;

        itemsListRef.current.style.transform = `translateX(-${
          ofsetCorrectionForCenterMode + itemsListRef.current.offsetWidth / 3
        }px)`;
      }
    },
    [
      activeSlideIndex,
      ofsetCorrectionForCenterMode,
      delay,
      easing,
      speed,
      stopAutoplay,
      onRequestChange,
    ]
  );

  const startAutoplay = useCallback(() => {
    if (autoplay) {
      stopAutoplay();
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
    stopAutoplay,
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

  const updateItemsListPosByDragPos = useCallback(
    (dragPos) => {
      const dragPosDiff =
        itemsListDragStartPosRef.current -
        dragPos +
        ofsetCorrectionForCenterMode +
        itemsListRef.current.offsetWidth / 3;
      const minDragPos = 0;
      const maxDragPos =
        itemsListRef.current.offsetWidth - innerRef.current.offsetWidth;
      const itemsListPos = Math.max(
        Math.min(minDragPos, -dragPosDiff),
        -maxDragPos
      );

      itemsListRef.current.style.transition = "none";
      itemsListRef.current.style.transform = `translateX(${itemsListPos}px)`;
    },
    [ofsetCorrectionForCenterMode]
  );

  const handleItemsListDragEnd = useCallback(
    (dragPos) => {
      const mousePosDiff = itemsListDragStartPosRef.current - dragPos;

      if (mousePosDiff > activeSlideWidth / 2) {
        updateActiveSlideIndex(getNextSlideIndex("forward"), "forward");
      } else if (mousePosDiff < -activeSlideWidth / 2) {
        updateActiveSlideIndex(getNextSlideIndex("backward"), "backward");
      } else {
        updateActiveSlideIndex(activeSlideIndex, "forward");
      }
    },
    [
      activeSlideIndex,
      activeSlideWidth,
      updateActiveSlideIndex,
      getNextSlideIndex,
    ]
  );

  const handleItemsListMouseMove = useCallback(
    (event) => {
      isListDraggingRef.current = true;

      updateItemsListPosByDragPos(event.clientX);
    },
    [updateItemsListPosByDragPos]
  );

  const handleItemsListMouseUp = useCallback(
    (event) => {
      itemsListRef.current.removeEventListener(
        "mouseout",
        handleItemsListMouseUp
      );
      itemsListRef.current.removeEventListener(
        "dragstart",
        handleItemsListMouseUp
      );

      document.removeEventListener("mousemove", handleItemsListMouseMove);
      document.removeEventListener("mouseup", handleItemsListMouseUp);

      if (isListDraggingRef.current) {
        handleItemsListDragEnd(event.clientX);
      }
    },
    [handleItemsListDragEnd, handleItemsListMouseMove]
  );

  const handleItemsListMouseDown = useCallback(
    (event) => {
      stopAutoplay();

      if (!isListDraggingRef.current) {
        itemsListDragStartPosRef.current = event.clientX;

        document.addEventListener("mousemove", handleItemsListMouseMove);
        document.addEventListener("mouseup", handleItemsListMouseUp);

        itemsListRef.current.addEventListener(
          "mouseout",
          handleItemsListMouseUp
        );
        itemsListRef.current.addEventListener(
          "dragstart",
          handleItemsListMouseUp
        );
      }
    },
    [handleItemsListMouseMove, handleItemsListMouseUp, stopAutoplay]
  );

  const handleItemsListTouchMove = useCallback(
    (event) => {
      isListDraggingRef.current = true;
      updateItemsListPosByDragPos(event.touches[0].clientX);
    },
    [updateItemsListPosByDragPos]
  );

  const handleItemsListTouchEnd = useCallback(
    (event) => {
      document.removeEventListener("touchmove", handleItemsListTouchMove);
      document.removeEventListener("touchend", handleItemsListTouchEnd);

      if (isListDraggingRef.current) {
        handleItemsListDragEnd(
          event.changedTouches[event.changedTouches.length - 1].clientX
        );
      }
    },
    [handleItemsListDragEnd, handleItemsListTouchMove]
  );

  const handleItemsListTouchStart = useCallback(
    (event) => {
      stopAutoplay();

      if (!isListDraggingRef.current) {
        itemsListDragStartPosRef.current = event.touches[0].clientX;

        document.addEventListener("touchmove", handleItemsListTouchMove);
        document.addEventListener("touchend", handleItemsListTouchEnd);
      }
    },
    [handleItemsListTouchMove, handleItemsListTouchEnd, stopAutoplay]
  );

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

      const direction =
        renderedSlidesCountRef.current >= slidesItems.length
          ? "forward"
          : "backward";

      const isActive = index + startIndex === activeSlideIndex;

      const className = `${itemClassName} ${
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

  const updateWindowWidth = useCallback(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  const handleWindowResize = useCallback(() => {
    clearTimeout(resizeTimerRef.current);
    stopAutoplay();

    resizeTimerRef.current = setTimeout(updateWindowWidth, 400);
  }, [updateWindowWidth, stopAutoplay]);

  useEffect(() => {
    itemsListDragStartPosRef.current = null;
    isListDraggingRef.current = false;
    directionRef.current = "";

    if (activeSlideIndex !== positionIndex) {
      if (!speed && !delay) {
        updatePositionIndex();
      }
    } else {
      if (onAfterChange) {
        onAfterChange(activeSlideIndex, positionIndex);
      }

      startAutoplay();
    }

    return () => {
      stopAutoplay();
    };
  }, [
    positionIndex,
    activeSlideIndex,
    onAfterChange,
    speed,
    delay,
    updatePositionIndex,
    startAutoplay,
    stopAutoplay,
  ]);

  useEffect(() => {
    if (windowWidth) {
      startAutoplay();
    }

    return () => {
      stopAutoplay();
    };
  }, [windowWidth, stopAutoplay]);

  useEffect(() => {
    const itemsListRefDOMElement = itemsListRef.current;

    updateWindowWidth();

    window.addEventListener("resize", handleWindowResize);

    return () => {
      clearTimeout(resizeTimerRef.current);
      window.removeEventListener("resize", handleWindowResize);

      document.removeEventListener("mousemove", handleItemsListMouseMove);
      document.removeEventListener("mouseup", handleItemsListMouseUp);
      document.removeEventListener("touchmove", handleItemsListTouchMove);
      document.removeEventListener("touchend", handleItemsListTouchEnd);

      itemsListRefDOMElement.removeEventListener(
        "mouseout",
        handleItemsListMouseUp
      );
      itemsListRefDOMElement.removeEventListener(
        "dragstart",
        handleItemsListMouseUp
      );
    };
  }, [
    handleItemsListMouseMove,
    handleWindowResize,
    handleItemsListMouseUp,
    handleItemsListTouchMove,
    handleItemsListTouchEnd,
    updateWindowWidth,
  ]);

  renderedSlidesCountRef.current = 0;

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
          onClick={handleBackwardBtnClick}
        >
          {backwardBtnChildren}
        </button>
      )}

      <div
        style={{
          display: "flex",
          boxSizing: "border-box",
          flexFlow: "row wrap",
          padding: "0",
          overflow: "hidden",
          maxWidth: innerMaxWidth ? `${innerMaxWidth}px` : "100%",
          ...innerStyle,
        }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...innerProps}
        ref={innerRef}
      >
        {/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
        <div
          style={{
            display: "flex",
            boxSizing: "border-box",
            outline: "none",
            ...(itemsListStyle || {}),
            transition: itemsListTransition,
            transform: itemsListTransform,
          }}
          onTouchStart={disableNav ? null : handleItemsListTouchStart}
          onMouseDown={disableNav ? null : handleItemsListMouseDown}
          onTransitionEnd={speed || delay ? updatePositionIndex : null}
          tabIndex="-1"
          role="presentation"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...itemsListProps}
          ref={itemsListRef}
        >
          {!disableNav &&
            renderSlidesItems(slidesItems.slice(positionIndex), positionIndex)}
          {renderSlidesItems(slidesItems, 0, disableNav)}
          {!disableNav && renderSlidesItems(slidesItems, 0)}
          {!disableNav &&
            renderSlidesItems(slidesItems.slice(0, positionIndex), 0)}
        </div>
      </div>

      {showForwardBtn && !hideNav && (
        <button
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...forwardBtnProps}
          type="button"
          onClick={handleForwardBtnClick}
        >
          {forwardBtnChildren}
        </button>
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
};

export default memo(ReactSimplyCarousel);
