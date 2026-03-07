import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Board } from '@/components/game/Board';

function createCanvasContextStub(): CanvasRenderingContext2D {
  return {
    arc: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fill: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('Board', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() =>
      createCanvasContextStub(),
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 320,
      bottom: 320,
      width: 320,
      height: 320,
      toJSON: () => '',
    } as DOMRect);
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps canvas clicks to the expected board coordinate', async () => {
    const onPlaceStone = vi.fn();

    render(
      <Board
        board={[]}
        currentTurn={0}
        disabled={false}
        highlightKeys={[]}
        illegalPositions={[]}
        scores={{}}
        showStoneIndices={false}
        visibleIndex={0}
        onPlaceStone={onPlaceStone}
      />,
    );

    const canvas = screen.getByTestId('board-interaction-layer');
    await waitFor(() => {
      expect(canvas.getAttribute('width')).toBe('320');
    });

    fireEvent.click(canvas, { clientX: 160, clientY: 160 });

    expect(onPlaceStone).toHaveBeenCalledWith(7, 7);
  });

  it('does not place a stone on disabled, occupied, or illegal coordinates', async () => {
    const onPlaceStone = vi.fn();

    const { rerender } = render(
      <Board
        board={[]}
        currentTurn={0}
        disabled={true}
        highlightKeys={[]}
        illegalPositions={[]}
        scores={{}}
        showStoneIndices={false}
        visibleIndex={0}
        onPlaceStone={onPlaceStone}
      />,
    );

    const canvas = screen.getByTestId('board-interaction-layer');
    await waitFor(() => {
      expect(canvas.getAttribute('width')).toBe('320');
    });

    fireEvent.click(canvas, { clientX: 160, clientY: 160 });

    rerender(
      <Board
        board={[{ color: 0, index: 1, x: 7, y: 7 }]}
        currentTurn={0}
        disabled={false}
        highlightKeys={[]}
        illegalPositions={[]}
        scores={{}}
        showStoneIndices={false}
        visibleIndex={1}
        onPlaceStone={onPlaceStone}
      />,
    );

    fireEvent.click(canvas, { clientX: 160, clientY: 160 });

    rerender(
      <Board
        board={[]}
        currentTurn={0}
        disabled={false}
        highlightKeys={[]}
        illegalPositions={['7,7']}
        scores={{}}
        showStoneIndices={false}
        visibleIndex={0}
        onPlaceStone={onPlaceStone}
      />,
    );

    fireEvent.click(canvas, { clientX: 160, clientY: 160 });

    expect(onPlaceStone).not.toHaveBeenCalled();
  });
});
