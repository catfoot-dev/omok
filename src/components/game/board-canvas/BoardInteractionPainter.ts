import { getBoardKey } from '@/lib/game/engine';

import { BoardGeometry } from './BoardGeometry';
import { clearCanvas, drawStone } from './drawUtils';
import type { BoardRenderState } from './types';

export class BoardInteractionPainter {
  paint(context: CanvasRenderingContext2D, geometry: BoardGeometry, state: BoardRenderState): void {
    clearCanvas(context, geometry);

    if (state.disabled || state.currentTurn === null || !state.hoveredKey) {
      return;
    }

    if (state.illegalSet.has(state.hoveredKey) || state.visibleBoard[state.hoveredKey]) {
      return;
    }

    const [y, x] = state.hoveredKey.split(',').map(Number);
    const point = geometry.gridToPoint(x, y);
    drawStone(context, geometry, point.x, point.y, state.currentTurn, { ghost: true });
  }

  isInteractive(state: BoardRenderState, key: string | null): boolean {
    if (!key || state.disabled || state.currentTurn === null) {
      return false;
    }

    const boardKey = key as ReturnType<typeof getBoardKey>;
    return !state.visibleBoard[boardKey] && !state.illegalSet.has(boardKey);
  }
}
