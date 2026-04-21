import { useState } from 'react';
import { render, screen } from '@testing-library/react';
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
});
