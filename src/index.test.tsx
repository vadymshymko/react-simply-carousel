import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Carousel, { type ReactSimplyCarouselProps } from './index';

const SLIDE_TEXTS = ['A', 'B', 'C', 'D'];

const slides = () =>
  SLIDE_TEXTS.map((text) => (
    <div key={text} data-testid={`slide-${text}`}>
      {text}
    </div>
  ));

const defaultProps = {
  forwardBtnProps: { children: 'Next' },
  backwardBtnProps: { children: 'Prev' },
  hideNavIfAllVisible: false,
  disableNavIfAllVisible: false,
} satisfies Partial<ReactSimplyCarouselProps>;

function Harness({
  initialIndex = 0,
  onRequestChange,
  ...rest
}: Partial<ReactSimplyCarouselProps> & { initialIndex?: number }) {
  const [idx, setIdx] = useState(initialIndex);
  return (
    <Carousel
      {...defaultProps}
      {...rest}
      activeSlideIndex={idx}
      onRequestChange={(next, info) => {
        onRequestChange?.(next, info);
        setIdx(next);
      }}
    >
      {slides()}
    </Carousel>
  );
}

describe('ReactSimplyCarousel', () => {
  it('renders all children as tabpanels (infinite renders 3x)', () => {
    render(<Harness />);
    // Default infinite=true → each slide rendered 3 times (before + main + dup)
    expect(screen.getAllByTestId('slide-A')).toHaveLength(3);
    expect(screen.getAllByTestId('slide-D')).toHaveLength(3);
  });

  it('renders children once when infinite={false}', () => {
    render(<Harness infinite={false} />);
    expect(screen.getAllByTestId('slide-A')).toHaveLength(1);
    expect(screen.getAllByTestId('slide-D')).toHaveLength(1);
  });

  it('renders forward/backward buttons with custom children', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev' })).toBeInTheDocument();
  });

  it('forward click requests next slide index', async () => {
    const user = userEvent.setup();
    const onRequestChange = jest.fn();
    render(<Harness onRequestChange={onRequestChange} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onRequestChange).toHaveBeenCalledTimes(1);
    expect(onRequestChange.mock.calls[0][0]).toBe(1);
  });

  it('backward click from index 0 wraps to last slide when infinite', async () => {
    const user = userEvent.setup();
    const onRequestChange = jest.fn();
    render(<Harness onRequestChange={onRequestChange} />);

    await user.click(screen.getByRole('button', { name: 'Prev' }));

    expect(onRequestChange).toHaveBeenCalledTimes(1);
    expect(onRequestChange.mock.calls[0][0]).toBe(SLIDE_TEXTS.length - 1);
  });

  it('forward click from last slide wraps to 0 when infinite', async () => {
    const user = userEvent.setup();
    const onRequestChange = jest.fn();
    render(
      <Harness
        initialIndex={SLIDE_TEXTS.length - 1}
        onRequestChange={onRequestChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onRequestChange).toHaveBeenCalledTimes(1);
    expect(onRequestChange.mock.calls[0][0]).toBe(0);
  });

  it('advances by itemsToScroll on forward click', async () => {
    const user = userEvent.setup();
    const onRequestChange = jest.fn();
    render(<Harness itemsToScroll={2} onRequestChange={onRequestChange} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onRequestChange.mock.calls[0][0]).toBe(2);
  });

  it('renders dots nav with ceil(slides / itemsToScroll) buttons', () => {
    render(<Harness itemsToScroll={2} dotsNav={{ show: true }} />);
    // 4 slides / 2 per scroll = 2 dots
    expect(screen.getByTitle('0')).toBeInTheDocument();
    expect(screen.getByTitle('1')).toBeInTheDocument();
    expect(screen.queryByTitle('2')).not.toBeInTheDocument();
  });

  it('clicking a dot requests the matching slide index', async () => {
    const user = userEvent.setup();
    const onRequestChange = jest.fn();
    render(
      <Harness
        itemsToScroll={2}
        dotsNav={{ show: true }}
        onRequestChange={onRequestChange}
      />
    );

    await user.click(screen.getByTitle('1'));

    // dot index 1 * itemsToScroll 2 = slide index 2
    expect(onRequestChange.mock.calls[0][0]).toBe(2);
  });

  it('updateOnItemClick calls onRequestChange with clicked slide index', async () => {
    const user = userEvent.setup();
    const onRequestChange = jest.fn();
    render(
      <Harness
        infinite={false}
        updateOnItemClick
        onRequestChange={onRequestChange}
      />
    );

    await user.click(screen.getByTestId('slide-C'));

    expect(onRequestChange).toHaveBeenCalled();
    expect(onRequestChange.mock.calls[0][0]).toBe(2);
  });

  it('passes custom attributes from forwardBtnProps to the button', () => {
    render(
      <Harness
        forwardBtnProps={{
          children: 'Next',
          'aria-label': 'go-next',
          className: 'fwd-btn',
        }}
      />
    );
    const btn = screen.getByRole('button', { name: 'go-next' });
    expect(btn).toHaveClass('fwd-btn');
  });

  describe('touch swipe axis lock', () => {
    const getItemsList = () =>
      document.querySelector('[role="presentation"]') as HTMLElement;

    it('requests a slide change on a horizontal swipe', () => {
      const onRequestChange = jest.fn();
      render(<Harness onRequestChange={onRequestChange} />);
      const list = getItemsList();

      fireEvent.touchStart(list, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchMove(document, {
        touches: [{ clientX: 100, clientY: 105 }],
      });
      fireEvent.touchEnd(document, {
        changedTouches: [{ clientX: 100, clientY: 105 }],
      });

      expect(onRequestChange).toHaveBeenCalled();
    });

    it('ignores a mostly-vertical move so the page can scroll', () => {
      const onRequestChange = jest.fn();
      render(<Harness onRequestChange={onRequestChange} />);
      const list = getItemsList();

      fireEvent.touchStart(list, { touches: [{ clientX: 100, clientY: 200 }] });
      fireEvent.touchMove(document, {
        touches: [{ clientX: 108, clientY: 100 }],
      });
      fireEvent.touchEnd(document, {
        changedTouches: [{ clientX: 108, clientY: 100 }],
      });

      expect(onRequestChange).not.toHaveBeenCalled();
    });

    it('keeps the gesture locked to vertical even if it later drifts horizontally', () => {
      const onRequestChange = jest.fn();
      render(<Harness onRequestChange={onRequestChange} />);
      const list = getItemsList();

      fireEvent.touchStart(list, { touches: [{ clientX: 100, clientY: 200 }] });
      // First move is vertical-dominant → locks to 'y'.
      fireEvent.touchMove(document, {
        touches: [{ clientX: 104, clientY: 100 }],
      });
      // Later horizontal drift must stay ignored.
      fireEvent.touchMove(document, {
        touches: [{ clientX: 250, clientY: 90 }],
      });
      fireEvent.touchEnd(document, {
        changedTouches: [{ clientX: 250, clientY: 90 }],
      });

      expect(onRequestChange).not.toHaveBeenCalled();
    });
  });

  describe('dirRTL (right-to-left)', () => {
    const getInner = () =>
      document.querySelector('[role="presentation"]')!.parentElement as HTMLElement;

    it('lays the viewport out right-to-left so slides are not pushed off-screen', () => {
      render(<Harness dirRTL />);
      // Without direction:rtl the positive translateX shifts the list out of
      // the viewport (issues #248/#250). The inner viewport must be rtl so the
      // list is right-anchored and the slides stay visible.
      expect(getInner().style.direction).toBe('rtl');
    });

    it('does not force rtl direction in LTR mode', () => {
      render(<Harness />);
      expect(getInner().style.direction).toBe('');
    });

    it('forward navigation still requests the next slide index in RTL', async () => {
      const user = userEvent.setup();
      const onRequestChange = jest.fn();
      render(<Harness dirRTL onRequestChange={onRequestChange} />);

      await user.click(screen.getByRole('button', { name: 'Next' }));

      expect(onRequestChange).toHaveBeenCalledTimes(1);
      expect(onRequestChange.mock.calls[0][0]).toBe(1);
    });
  });
});
