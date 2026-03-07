import { describe, expect, it, vi } from 'vitest';

import { BoardGeometry } from '@/components/game/board-canvas/BoardGeometry';
import { BoardScene } from '@/components/game/board-canvas/BoardScene';
import type { BoardRenderState } from '@/components/game/board-canvas/types';
import { createBoardMap } from '@/lib/game/engine';

function createContextStub(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function createCanvasStub(context: CanvasRenderingContext2D): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  vi.spyOn(canvas, 'getContext').mockReturnValue(context);
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
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
  return canvas;
}

function createState(overrides?: Partial<BoardRenderState>): BoardRenderState {
  return {
    visibleBoard: {},
    currentTurn: 0,
    disabled: false,
    highlightSet: new Set(),
    illegalSet: new Set(),
    scoreMap: new Map(),
    showStoneIndices: false,
    hoveredKey: null,
    ...overrides,
  };
}

describe('BoardScene', () => {
  it('redraws background on resize and overlay on sync', () => {
    const geometry = new BoardGeometry();
    const backgroundPainter = { paint: vi.fn() };
    const overlayPainter = { paint: vi.fn() };
    const interactionPainter = { paint: vi.fn(), isInteractive: vi.fn().mockReturnValue(false) };
    const scene = new BoardScene({
      onPlaceStone: vi.fn(),
      geometry,
      backgroundPainter: backgroundPainter as never,
      overlayPainter: overlayPainter as never,
      interactionPainter: interactionPainter as never,
    });

    const wrapper = document.createElement('div');
    const background = createCanvasStub(createContextStub());
    const overlay = createCanvasStub(createContextStub());
    const interaction = createCanvasStub(createContextStub());

    scene.mount({ background, overlay, interaction }, wrapper);
    scene.resize(320, 320, 1);
    scene.sync(createState());
    scene.handlePointerMove({ clientX: 160, clientY: 160 });

    expect(backgroundPainter.paint).toHaveBeenCalledTimes(1);
    expect(overlayPainter.paint).toHaveBeenCalledTimes(2);
    expect(interactionPainter.paint).toHaveBeenCalledTimes(2);
  });

  it('updates overlay when the visible board changes and keeps hover redraw isolated', () => {
    const geometry = new BoardGeometry();
    const backgroundPainter = { paint: vi.fn() };
    const overlayPainter = { paint: vi.fn() };
    const interactionPainter = { paint: vi.fn(), isInteractive: vi.fn().mockReturnValue(true) };
    const scene = new BoardScene({
      onPlaceStone: vi.fn(),
      geometry,
      backgroundPainter: backgroundPainter as never,
      overlayPainter: overlayPainter as never,
      interactionPainter: interactionPainter as never,
    });

    const wrapper = document.createElement('div');
    const background = createCanvasStub(createContextStub());
    const overlay = createCanvasStub(createContextStub());
    const interaction = createCanvasStub(createContextStub());

    scene.mount({ background, overlay, interaction }, wrapper);
    scene.resize(320, 320, 1);
    scene.sync(
      createState({
        visibleBoard: createBoardMap([{ color: 0, index: 1, x: 7, y: 7 }]),
      }),
    );
    scene.handlePointerMove({ clientX: 160, clientY: 160 });

    expect(backgroundPainter.paint).toHaveBeenCalledTimes(1);
    expect(overlayPainter.paint).toHaveBeenCalledTimes(2);
    expect(interactionPainter.paint).toHaveBeenCalledTimes(3);
  });
});
