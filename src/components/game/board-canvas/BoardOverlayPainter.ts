import { getBoardKey } from '@/lib/game/engine';

import { BoardGeometry } from './BoardGeometry';
import { clearCanvas, drawCenteredText, drawHighlightRing, drawStone } from './drawUtils';
import type { BoardRenderState } from './types';

function formatScore(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export class BoardOverlayPainter {
  paint(context: CanvasRenderingContext2D, geometry: BoardGeometry, state: BoardRenderState): void {
    clearCanvas(context, geometry);

    const stones = Object.values(state.visibleBoard).sort(
      (left, right) => left.index - right.index,
    );
    const occupiedKeys = new Set(stones.map((stone) => getBoardKey(stone.x, stone.y)));

    for (const [key, score] of state.scoreMap.entries()) {
      if (
        score <= 0 ||
        !Number.isFinite(score) ||
        occupiedKeys.has(key) ||
        state.illegalSet.has(key)
      ) {
        continue;
      }

      const [y, x] = key.split(',').map(Number);
      const point = geometry.gridToPoint(x, y);
      drawCenteredText(context, formatScore(score), point.x, point.y, {
        color: 'rgba(255, 255, 255, 0.92)',
        fontSize: geometry.getScoreFontSize(),
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      });
    }

    for (const key of state.illegalSet) {
      if (occupiedKeys.has(key)) {
        continue;
      }

      const [y, x] = key.split(',').map(Number);
      const point = geometry.gridToPoint(x, y);
      drawCenteredText(context, '×', point.x, point.y, {
        color: '#d91a28',
        fontSize: Math.max(16, geometry.getCellSize() * 0.66),
      });
    }

    for (const stone of stones) {
      const point = geometry.gridToPoint(stone.x, stone.y);
      drawStone(context, geometry, point.x, point.y, stone.color);
    }

    if (state.showStoneIndices) {
      for (const stone of stones) {
        const point = geometry.gridToPoint(stone.x, stone.y);
        drawCenteredText(context, `${stone.index}`, point.x, point.y, {
          color: stone.color === 0 ? '#fff4dc' : '#231c16',
          fontSize: geometry.getStoneFontSize(),
          shadowColor: stone.color === 0 ? 'rgba(0,0,0,0.48)' : 'rgba(255,255,255,0.38)',
        });
      }
    }

    for (const key of state.highlightSet) {
      if (!occupiedKeys.has(key)) {
        continue;
      }

      const [y, x] = key.split(',').map(Number);
      const point = geometry.gridToPoint(x, y);
      drawHighlightRing(context, geometry, point.x, point.y);
    }
  }
}
