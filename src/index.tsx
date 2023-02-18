import React, {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  Children,
  HTMLAttributes,
  ButtonHTMLAttributes,
  ReactElement,
  MouseEvent,
  TouchEvent,
  ReactNode,
  TransitionEvent,
} from 'react';

type NavDirection = 'forward' | 'backward';

type NavBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { show?: boolean };

type DotsNav = {
  show?: boolean;
  containerProps?: HTMLAttributes<HTMLDivElement>;
  itemBtnProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  activeItemBtnProps?: ButtonHTMLAttributes<HTMLButtonElement>;
};

type VisibleSlidesState = {
  isFirstSlideVisible: boolean;
  isLastSlideVisible: boolean;
  visibleSlides: { slideIndex: number; isFullyVisible: boolean }[];
};

type ReactSimplyCarouselStaticProps = {
  activeSlideIndex: number;
  activeSlideProps?: HTMLAttributes<any>;
  autoplay?: boolean;
  autoplayDelay?: number;
  autoplayDirection?: NavDirection;
  backwardBtnProps?: NavBtnProps;
  centerMode?: boolean;
  children?: ReactNode;
  containerProps?: HTMLAttributes<HTMLDivElement>;
  delay?: number;
  disableNavIfAllVisible?: boolean;
  disableNavIfEdgeActive?: boolean;
  disableNavIfEdgeVisible?: boolean;
  disableSwipeByMouse?: boolean;
  disableSwipeByTouch?: boolean;
  dotsNav?: DotsNav;
  easing?: string;
  forwardBtnProps?: NavBtnProps;
  hideNavIfAllVisible?: boolean;
  infinite?: boolean;
  innerProps?: HTMLAttributes<HTMLDivElement>;
  itemsListProps?: HTMLAttributes<HTMLDivElement>;
  itemsToScroll?: number;
  itemsToShow?: number;
  onAfterChange?: (
    // eslint-disable-next-line no-unused-vars
    activeSlideIndex: number,
    // eslint-disable-next-line no-unused-vars
    deprecated_positionSlideIndex: number
  ) => void;
  onRequestChange: (
    // eslint-disable-next-line no-unused-vars
    newActiveSlideIndex: number,
    // eslint-disable-next-line no-unused-vars
    newVisibleSlidesState: VisibleSlidesState
  ) => void;
  persistentChangeCallbacks?: boolean;
  preventScrollOnSwipe?: boolean;
  showSlidesBeforeInit?: boolean;
  speed?: number;
  updateOnItemClick?: boolean;
  visibleSlideProps?: HTMLAttributes<any>;
};

type ReactSimplyCarouselResponsiveProps = (Omit<
  Omit<ReactSimplyCarouselStaticProps, 'activeSlideIndex'>,
  'onRequestChange'
> & { minWidth?: number; maxWidth?: number })[];

export type ReactSimplyCarouselProps = ReactSimplyCarouselStaticProps & {
  responsiveProps?: ReactSimplyCarouselResponsiveProps;
};

function ReactSimplyCarousel({
  responsiveProps = [],
  ...props
}: ReactSimplyCarouselProps) {
  const [windowWidth, setWindowWidth] = useState(0);
  const [positionIndex, setPositionIndex] = useState(props.activeSlideIndex);

  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const itemsListRef = useRef<HTMLDivElement>(null);
  const isMissingTransitionEndRef = useRef(false);

  const itemsListDragStartPosRef = useRef(0);
  const isListDraggingRef = useRef(false);

  const directionRef = useRef<NavDirection | ''>('');

  const autoplayTimerRef = useRef<any>(null);
  const resizeTimerRef = useRef<any>(null);

  const renderedSlidesCountRef = useRef(0);
  const firstRenderSlideIndexRef = useRef(positionIndex);

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

  const slidesItems = Children.toArray(
    propsByWindowWidth.children
  ) as ReactElement<any>[];

  const {
    containerProps: { style: containerStyle = {}, ...containerProps } = {},

    innerProps: { style: innerStyle = {}, ...innerProps } = {},
    itemsListProps: {
      style: itemsListStyle = {},
      onTransitionEnd: onItemsListTransitionEnd = undefined,
      ...itemsListProps
    } = {},
    backwardBtnProps: {
      children: backwardBtnChildren = null,
      show: showBackwardBtn = true,
      ...backwardBtnProps
    } = {},
    forwardBtnProps: {
      children: forwardBtnChildren = null,
      show: showForwardBtn = true,
      ...forwardBtnProps
    } = {},
    activeSlideProps: {
      className: activeSlideClassName = '',
      style: activeSlideStyle = {},
      ...activeSlideProps
    } = {},
    visibleSlideProps: {
      className: visibleSlideClassName = '',
      style: visibleSlideStyle = {},
      ...visibleSlideProps
    } = {},
    updateOnItemClick = false,
    activeSlideIndex,
    onRequestChange,
    speed = 0,
    delay = 0,
    easing = 'linear',
    itemsToShow = 0,
    itemsToScroll = 1,
    children,
    onAfterChange,
    autoplay = false,
    autoplayDirection = 'forward',
    disableNavIfAllVisible = true,
    hideNavIfAllVisible = true,
    centerMode = false,
    infinite = true,
    disableNavIfEdgeVisible = true,
    disableNavIfEdgeActive = true,
    dotsNav = {},
    persistentChangeCallbacks = false,
    autoplayDelay = 0,
    preventScrollOnSwipe = false,
    disableSwipeByMouse = false,
    disableSwipeByTouch = false,
  } = windowWidth
    ? {
        ...propsByWindowWidth,
        activeSlideIndex: Math.max(
          0,
          Math.min(propsByWindowWidth.activeSlideIndex, slidesItems.length - 1)
        ),
        itemsToShow: Math.min(
          slidesItems.length,
          propsByWindowWidth.itemsToShow || 0
        ),
        itemsToScroll: Math.min(
          slidesItems.length,
          propsByWindowWidth.itemsToScroll || 1
        ),
      }
    : props;

  const {
    show: showDotsNav = false,
    containerProps: dotsNavContainerProps = {},
    itemBtnProps: dotsNavBtnProps = {},
    activeItemBtnProps: dotsNavActiveBtnProps = {},
  } = (dotsNav as DotsNav) || {};

  const lastSlideIndex = Children.count(children) - 1;
  const isAllSlidesVisible = itemsToShow === slidesItems.length;
  const hideNav = hideNavIfAllVisible && isAllSlidesVisible;
  const disableNav = disableNavIfAllVisible && isAllSlidesVisible;
  const itemsListTransition =
    activeSlideIndex - positionIndex === 0 || !(speed || delay)
      ? 'none'
      : `transform ${speed}ms ${easing} ${delay}ms`;

  const getRenderParams = useCallback(
    ({
      correctionSlideIndex,
      prevCorrectionSlideIndex,
      curActiveSlideIndex,
    }: {
      correctionSlideIndex: number;
      prevCorrectionSlideIndex: number;
      curActiveSlideIndex: number;
    }) => {
      const itemsListWidth = itemsListRef.current!.offsetWidth;
      const itemsListChildren = itemsListRef.current!.children;
      const itemsListChildrenCount = itemsListChildren.length;

      const slidesHTMLElements = infinite
        ? ([...itemsListChildren].slice(
            itemsListChildrenCount / 3 - prevCorrectionSlideIndex,
            itemsListChildrenCount / 3 -
              prevCorrectionSlideIndex +
              itemsListChildrenCount / 3
          ) as HTMLElement[])
        : ([...itemsListChildren] as HTMLElement[]);

      const activeSlideWidth =
        slidesHTMLElements[curActiveSlideIndex]?.offsetWidth;

      const innerMaxWidth = itemsToShow
        ? slidesHTMLElements.reduce((result, item, index) => {
            const isItemVisible =
              (index >= curActiveSlideIndex &&
                index < curActiveSlideIndex + itemsToShow) ||
              (index < curActiveSlideIndex &&
                index <
                  curActiveSlideIndex +
                    itemsToShow -
                    slidesHTMLElements.length);

            if (!isItemVisible) {
              return result;
            }

            return result + item.offsetWidth;
          }, 0)
        : innerRef.current!.offsetWidth;

      const itemsListMaxTranslateX = itemsListWidth - innerMaxWidth;

      const offsetCorrectionForCenterMode =
        centerMode && infinite ? -(innerMaxWidth - activeSlideWidth) / 2 : 0;

      const offsetCorrectionForInfiniteMode = infinite ? itemsListWidth / 3 : 0;

      const offsetCorrectionForEdgeSlides =
        // eslint-disable-next-line no-nested-ternary
        correctionSlideIndex - curActiveSlideIndex === 0
          ? 0
          : // eslint-disable-next-line no-nested-ternary
          directionRef.current === 'forward' &&
            curActiveSlideIndex < correctionSlideIndex
          ? offsetCorrectionForInfiniteMode
          : directionRef.current === 'backward' &&
            curActiveSlideIndex > correctionSlideIndex
          ? -offsetCorrectionForInfiniteMode
          : 0;

      const isNewSlideIndex = curActiveSlideIndex - correctionSlideIndex !== 0;

      const getItemsListOffsetBySlideIndex = (slideIndex: number) => {
        const offsetByIndex = slidesHTMLElements.reduce(
          (total, item, index) => {
            if (index >= slideIndex) {
              return total;
            }

            return total + (item.offsetWidth || 0);
          },
          0
        );

        if (infinite) {
          return offsetByIndex;
        }

        return Math.min(itemsListMaxTranslateX, offsetByIndex);
      };

      const positionIndexOffset =
        isNewSlideIndex && infinite
          ? getItemsListOffsetBySlideIndex(correctionSlideIndex)
          : 0;
      const activeSlideIndexOffset =
        isNewSlideIndex || !infinite
          ? getItemsListOffsetBySlideIndex(curActiveSlideIndex)
          : 0;

      const itemsListTranslateX = disableNav
        ? 0
        : activeSlideIndexOffset -
          positionIndexOffset +
          offsetCorrectionForCenterMode +
          offsetCorrectionForEdgeSlides +
          offsetCorrectionForInfiniteMode;
      const itemsListTransform = `translateX(-${itemsListTranslateX}px)`;

      const start = infinite
        ? offsetCorrectionForInfiniteMode + offsetCorrectionForCenterMode
        : Math.min(
            itemsListMaxTranslateX,
            slidesHTMLElements.reduce((res, item, index) => {
              if (index < curActiveSlideIndex) {
                return res + item.offsetWidth;
              }

              return res;
            }, 0)
          );
      const end = start + innerMaxWidth;

      const slidesHTMLElementsDefault = slidesHTMLElements.map(
        (htmlElement, index) => ({
          slideIndex: index,
          htmlElement,
        })
      );

      const slidesHTMLElementsInRender = infinite
        ? [
            ...slidesHTMLElements
              .slice(curActiveSlideIndex)
              .map((htmlElement, index) => ({
                slideIndex: index + curActiveSlideIndex,
                htmlElement,
              })),
            ...slidesHTMLElementsDefault,
            ...slidesHTMLElementsDefault,
            ...slidesHTMLElements
              .slice(0, curActiveSlideIndex)
              .map((htmlElement, index) => ({
                slideIndex: index,
                htmlElement,
              })),
          ]
        : slidesHTMLElementsDefault;

      const visibilityItemsState = slidesHTMLElementsInRender.reduce(
        (result, { slideIndex, htmlElement }) => {
          const htmlElementWidth = htmlElement.offsetWidth;

          if (
            (result.summ >= start && result.summ < end) ||
            (result.summ + htmlElementWidth > start &&
              result.summ + htmlElementWidth <= end)
          ) {
            result.items.push({
              slideIndex,
              isFullyVisible:
                result.summ + htmlElementWidth <= end && result.summ >= start,
            });
          }

          // eslint-disable-next-line no-param-reassign
          result.summ += htmlElementWidth;

          return result;
        },
        {
          summ: 0,
          items: [] as { slideIndex: number; isFullyVisible: boolean }[],
        }
      );

      const isFirstSlideVisible = !!visibilityItemsState.items.find(
        (item) => item.slideIndex === 0
      );

      const isLastSlideVisible = !!visibilityItemsState.items.find(
        (item) => item.slideIndex === slidesHTMLElements.length - 1
      );

      return {
        slidesHTMLElements,
        innerMaxWidth,
        itemsListMaxTranslateX,
        activeSlideWidth,
        offsetCorrectionForCenterMode,
        offsetCorrectionForInfiniteMode,
        itemsListTranslateX,
        itemsListTransform,
        visibleSlides: visibilityItemsState.items,
        isFirstSlideVisible,
        isLastSlideVisible,
      };
    },
    [centerMode, disableNav, infinite, itemsToShow]
  );

  const {
    innerMaxWidth = 0,
    itemsListMaxTranslateX = 0,
    activeSlideWidth = 0,
    offsetCorrectionForCenterMode = 0,
    offsetCorrectionForInfiniteMode = 0,
    itemsListTranslateX = 0,
    itemsListTransform = 'none',
    visibleSlides = [],
  } = windowWidth
    ? getRenderParams({
        prevCorrectionSlideIndex: firstRenderSlideIndexRef.current,
        curActiveSlideIndex: activeSlideIndex,
        correctionSlideIndex: positionIndex,
      })
    : {};

  const getNextSlideIndex = useCallback(
    (direction: NavDirection) => {
      if (direction === 'forward') {
        const nextSlideIndex = activeSlideIndex + itemsToScroll;
        const isOnEnd = nextSlideIndex > lastSlideIndex;
        // eslint-disable-next-line no-nested-ternary
        const newSlideIndex = isOnEnd
          ? infinite
            ? nextSlideIndex - lastSlideIndex - 1
            : lastSlideIndex
          : nextSlideIndex;

        return newSlideIndex;
      }

      if (direction === 'backward') {
        const nextSlideIndex = activeSlideIndex - itemsToScroll;
        const isOnStart = nextSlideIndex < 0;
        // eslint-disable-next-line no-nested-ternary
        const newSlideIndex = isOnStart
          ? infinite
            ? lastSlideIndex + 1 + nextSlideIndex
            : 0
          : nextSlideIndex;

        return newSlideIndex;
      }

      return activeSlideIndex;
    },
    [activeSlideIndex, itemsToScroll, lastSlideIndex, infinite]
  );

  const updateActiveSlideIndex = useCallback(
    (newActiveSlideIndex: number, direction: NavDirection) => {
      directionRef.current = direction;
      itemsListRef.current!.style.transition =
        speed || delay ? `transform ${speed}ms ${easing} ${delay}ms` : 'none';

      if (
        newActiveSlideIndex !== activeSlideIndex ||
        persistentChangeCallbacks
      ) {
        clearTimeout(autoplayTimerRef.current);

        const {
          visibleSlides: nextVisibleSlides,
          isFirstSlideVisible: nextIsFirstSlideVisible,
          isLastSlideVisible: nextIsLastSlideVisible,
          itemsListTransform: nextItemsListTransform,
        } = getRenderParams({
          correctionSlideIndex: positionIndex,
          prevCorrectionSlideIndex: positionIndex,
          curActiveSlideIndex: newActiveSlideIndex,
        });

        if (
          newActiveSlideIndex !== activeSlideIndex &&
          itemsListRef.current?.style.transform === nextItemsListTransform
        ) {
          isMissingTransitionEndRef.current = true;
        }

        itemsListRef.current!.style.transform = nextItemsListTransform;

        onRequestChange(newActiveSlideIndex, {
          visibleSlides: nextVisibleSlides,
          isFirstSlideVisible: nextIsFirstSlideVisible,
          isLastSlideVisible: nextIsLastSlideVisible,
        });
      } else {
        itemsListRef.current!.style.transform = `translateX(-${
          offsetCorrectionForCenterMode +
          offsetCorrectionForInfiniteMode +
          (infinite ? 0 : itemsListTranslateX)
        }px)`;
      }
    },
    [
      persistentChangeCallbacks,
      activeSlideIndex,
      offsetCorrectionForCenterMode,
      delay,
      easing,
      speed,
      onRequestChange,
      offsetCorrectionForInfiniteMode,
      infinite,
      itemsListTranslateX,
      positionIndex,
      getRenderParams,
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
      }, autoplayDelay || delay);
    }
  }, [
    autoplay,
    autoplayDirection,
    autoplayDelay,
    updateActiveSlideIndex,
    getNextSlideIndex,
    delay,
  ]);

  const handleBackwardBtnClick = useCallback(() => {
    updateActiveSlideIndex(getNextSlideIndex('backward'), 'backward');
  }, [updateActiveSlideIndex, getNextSlideIndex]);

  const handleItemsListTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      setPositionIndex(activeSlideIndex);

      if (onItemsListTransitionEnd) {
        onItemsListTransitionEnd(event);
      }
    },
    [activeSlideIndex, onItemsListTransitionEnd]
  );

  const handleForwardBtnClick = useCallback(() => {
    updateActiveSlideIndex(getNextSlideIndex('forward'), 'forward');
  }, [updateActiveSlideIndex, getNextSlideIndex]);

  const getSlideItemOnClick = ({
    direction,
    index,
    onClick,
  }: {
    direction: NavDirection;
    index: number;
    onClick?: any;
  }) => {
    const slideItemOnClick = (event: MouseEvent) => {
      const forwardDirectionValue = activeSlideIndex < index ? 'forward' : '';
      const backwardDirectionValue = activeSlideIndex > index ? 'backward' : '';

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

  const renderSlidesItems = (
    items: ReactElement<any>[],
    startIndex: number,
    isDisableNav?: boolean
  ) =>
    items.map((item, index) => {
      const {
        props: {
          className: itemClassName = '',
          onClick: itemOnClick = null,
          style: itemStyle = {},
          ...itemComponentProps
        } = {},
        ...slideComponentData
      } = item;

      // eslint-disable-next-line no-nested-ternary
      const direction = infinite
        ? renderedSlidesCountRef.current >= slidesItems.length
          ? 'forward'
          : 'backward'
        : index >= activeSlideIndex
        ? 'forward'
        : 'backward';

      const isActive: boolean = index + startIndex === activeSlideIndex;
      const isVisible = visibleSlides.find(
        (slide) => slide.slideIndex === index + startIndex
      );

      const className =
        `${itemClassName} ${isActive ? activeSlideClassName : ''} ${
          isVisible ? visibleSlideClassName : ''
        }`.trim() || undefined;
      const style = {
        ...itemStyle,
        ...(isVisible ? visibleSlideStyle : {}),
        ...(isActive ? activeSlideStyle : {}),
        boxSizing: 'border-box',
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
        role: 'tabpanel',
        className,
        style,
        onClick,
        ...itemComponentProps,
        ...(isVisible ? visibleSlideProps : {}),
        ...(isActive ? activeSlideProps : {}),
      };

      renderedSlidesCountRef.current += 1;

      return {
        props: slideProps,
        ...slideComponentData,
      };
    });

  useEffect(() => {
    const listRef = itemsListRef.current;

    function preventClick(clickEvent: TouchEvent | MouseEvent) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
    }

    function handleListSwipe(event: TouchEvent | MouseEvent) {
      isListDraggingRef.current = true;

      const isTouch = !!(event as TouchEvent).touches?.[0];

      const dragPos = isTouch
        ? (event as TouchEvent).touches?.[0].clientX
        : (event as MouseEvent).clientX;

      const dragPosDiff =
        itemsListDragStartPosRef.current -
        dragPos +
        offsetCorrectionForCenterMode +
        offsetCorrectionForInfiniteMode +
        (infinite ? 0 : itemsListTranslateX);
      const minDragPos = 0;
      // todo: replace by itemsListMaxTranslateX
      const maxDragPos = itemsListRef.current!.offsetWidth; // - innerRef.current!.offsetWidth;
      const itemsListPos = Math.max(
        Math.min(minDragPos, -dragPosDiff),
        -maxDragPos
      );
      itemsListRef.current!.style.transition = 'none';
      itemsListRef.current!.style.transform = `translateX(${itemsListPos}px)`;
    }

    function handleListSwipeEnd(event: TouchEvent | MouseEvent) {
      document.removeEventListener('mousemove', handleListSwipe as () => {});
      document.removeEventListener('mouseup', handleListSwipeEnd as () => {});
      document.removeEventListener('touchmove', handleListSwipe as () => {});
      document.removeEventListener('touchend', handleListSwipeEnd as () => {});

      if (isListDraggingRef.current) {
        event.target?.addEventListener('click', preventClick as () => {});

        const isTouch = !!(event as TouchEvent).changedTouches?.[0];

        const dragPos = isTouch
          ? (event as TouchEvent).changedTouches[
              (event as TouchEvent).changedTouches.length - 1
            ].clientX
          : (event as MouseEvent).clientX;

        const mousePosDiff = itemsListDragStartPosRef.current - dragPos;

        const nextActiveSlide =
          // eslint-disable-next-line no-nested-ternary
          mousePosDiff > activeSlideWidth / 2
            ? {
                index: getNextSlideIndex('forward'),
                direction: 'forward',
              }
            : mousePosDiff < -activeSlideWidth / 2
            ? {
                index: getNextSlideIndex('backward'),
                direction: 'backward',
              }
            : {
                index: activeSlideIndex,
                direction: 'forward',
              };

        updateActiveSlideIndex(
          nextActiveSlide.index,
          nextActiveSlide.direction as NavDirection
        );
      } else {
        event.target?.removeEventListener('click', preventClick as () => {});
      }
      itemsListDragStartPosRef.current = 0;
      isListDraggingRef.current = false;
    }

    function handleListSwipeStart(event: TouchEvent | MouseEvent) {
      clearTimeout(autoplayTimerRef.current);

      const isTouch = !!(event as TouchEvent).touches?.[0];

      itemsListDragStartPosRef.current = isTouch
        ? (event as TouchEvent).touches?.[0].clientX
        : (event as MouseEvent).clientX;

      if (isTouch) {
        document.addEventListener('touchmove', handleListSwipe as () => {});
        document.addEventListener('touchend', handleListSwipeEnd as () => {});
      } else {
        document.addEventListener('mousemove', handleListSwipe as () => {});
        document.addEventListener('mouseup', handleListSwipeEnd as () => {});
      }
    }

    if (!disableNav) {
      if (!disableSwipeByMouse) {
        listRef?.addEventListener(
          'mousedown',
          handleListSwipeStart as () => {}
        );
      }

      if (!disableSwipeByTouch) {
        listRef?.addEventListener(
          'touchstart',
          handleListSwipeStart as () => {},
          {
            passive: true,
          }
        );
      }
    }

    return () => {
      isListDraggingRef.current = false;
      itemsListDragStartPosRef.current = 0;

      listRef?.removeEventListener(
        'mousedown',
        handleListSwipeStart as () => {}
      );
      listRef?.removeEventListener(
        'touchstart',
        handleListSwipeStart as () => {}
      );

      document.removeEventListener('mousemove', handleListSwipe as () => {});
      document.removeEventListener('mouseup', handleListSwipeEnd as () => {});
      document.removeEventListener('touchmove', handleListSwipe as () => {});
      document.removeEventListener('touchend', handleListSwipeEnd as () => {});
    };
  }, [
    infinite,
    itemsListTranslateX,
    itemsListTransform,
    offsetCorrectionForCenterMode,
    offsetCorrectionForInfiniteMode,
    activeSlideIndex,
    activeSlideWidth,
    getNextSlideIndex,
    updateActiveSlideIndex,
    disableNav,
    disableSwipeByMouse,
    disableSwipeByTouch,
  ]);

  useEffect(() => {
    if (activeSlideIndex !== positionIndex) {
      if ((!speed && !delay) || isMissingTransitionEndRef.current) {
        isMissingTransitionEndRef.current = false;
        setPositionIndex(activeSlideIndex);
      }
    } else {
      if (onAfterChange) {
        onAfterChange(activeSlideIndex, positionIndex);
      }

      if (
        infinite ||
        (autoplayDirection === 'forward' &&
          activeSlideIndex !== lastSlideIndex) ||
        (autoplayDirection === 'backward' && activeSlideIndex !== 0)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth]);

  useEffect(() => {
    function handleWindowResize() {
      clearTimeout(resizeTimerRef.current);
      clearTimeout(autoplayTimerRef.current);

      resizeTimerRef.current = setTimeout(() => {
        if (windowWidth !== window.innerWidth) {
          setWindowWidth(window.innerWidth);
        }
      }, 400);
    }

    if (windowWidth !== window.innerWidth) {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(resizeTimerRef.current);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [windowWidth]);

  // directionRef.current = "";

  renderedSlidesCountRef.current = 0;
  firstRenderSlideIndexRef.current = positionIndex;

  return (
    <div
      style={{
        display: 'flex',
        flexFlow: 'row wrap',
        boxSizing: 'border-box',
        justifyContent: 'center',
        width: `100%`,
        userSelect: 'none',
        ...containerStyle,
      }}
      {...containerProps}
      ref={containerRef}
    >
      {showBackwardBtn && !hideNav && (
        <button
          {...backwardBtnProps}
          type="button"
          onClick={
            ((itemsListTranslateX === 0 && disableNavIfEdgeVisible) ||
              (activeSlideIndex === 0 && disableNavIfEdgeActive)) &&
            !infinite
              ? undefined
              : handleBackwardBtnClick
          }
          disabled={
            typeof backwardBtnProps.disabled === 'boolean'
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
        {...innerProps}
        style={{
          ...innerStyle,
          display: 'flex',
          boxSizing: 'border-box',
          flexFlow: 'row wrap',
          padding: '0',
          overflow: 'hidden',
          maxWidth: innerMaxWidth ? `${innerMaxWidth}px` : undefined,
          flex: !innerMaxWidth ? `1 0` : undefined,
        }}
        ref={innerRef}
      >
        {/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
        <div
          {...itemsListProps}
          style={{
            ...itemsListStyle,
            display: 'flex',
            boxSizing: 'border-box',
            outline: 'none',
            transition: itemsListTransition,
            transform: itemsListTransform,
            touchAction: preventScrollOnSwipe ? 'none' : 'auto',
          }}
          data-transform={itemsListTransform}
          onTransitionEnd={
            speed || delay
              ? handleItemsListTransitionEnd
              : onItemsListTransitionEnd
          }
          tabIndex={-1}
          role="presentation"
          ref={itemsListRef}
        >
          {infinite &&
            renderSlidesItems(
              slidesItems.slice(positionIndex),
              positionIndex,
              disableNav
            )}
          {renderSlidesItems(slidesItems, 0, disableNav)}
          {infinite && renderSlidesItems(slidesItems, 0, disableNav)}
          {infinite &&
            renderSlidesItems(
              slidesItems.slice(0, positionIndex),
              0,
              disableNav
            )}
        </div>
      </div>

      {showForwardBtn && !hideNav && (
        <button
          {...forwardBtnProps}
          type="button"
          onClick={
            ((itemsListTranslateX === itemsListMaxTranslateX &&
              disableNavIfEdgeVisible) ||
              (activeSlideIndex === lastSlideIndex &&
                disableNavIfEdgeActive)) &&
            !infinite
              ? undefined
              : handleForwardBtnClick
          }
          disabled={
            typeof forwardBtnProps.disabled === 'boolean'
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

      {!!showDotsNav && (
        <div
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          {...dotsNavContainerProps}
        >
          {Array.from({
            length: Math.ceil(slidesItems.length / itemsToScroll),
          }).map((_item, index) => (
            <button
              type="button"
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              title={`${index}`}
              {...dotsNavBtnProps}
              {...(activeSlideIndex >= index * itemsToScroll &&
              activeSlideIndex <
                Math.min(itemsToScroll * (index + 1), lastSlideIndex + 1)
                ? dotsNavActiveBtnProps
                : {})}
              onClick={() => {
                updateActiveSlideIndex(
                  Math.min(index * itemsToScroll, slidesItems.length - 1),
                  Math.min(index * itemsToScroll, slidesItems.length - 1) >
                    activeSlideIndex
                    ? 'forward'
                    : 'backward'
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ReactSimplyCarousel);
