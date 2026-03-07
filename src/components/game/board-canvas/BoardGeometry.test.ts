import { describe, expect, it } from 'vitest';

import { BoardGeometry } from '@/components/game/board-canvas/BoardGeometry';

describe('BoardGeometry', () => {
  it('maps a centered pixel to the expected board coordinate', () => {
    const geometry = new BoardGeometry();
    geometry.resize(320, 320, 2);

    expect(geometry.getCellSize()).toBeCloseTo(20);
    expect(geometry.gridToPoint(7, 7)).toEqual({ x: 160, y: 160 });
    expect(geometry.pointToGrid(160, 160)).toEqual({ x: 7, y: 7, key: '7,7' });
  });

  it('keeps hit-test tolerance consistent across board sizes', () => {
    const geometry = new BoardGeometry();
    geometry.resize(352, 352, 1);

    const point = geometry.gridToPoint(0, 0);
    const tolerance = geometry.getCellSize();

    expect(geometry.pointToGrid(point.x + tolerance * 0.44, point.y)).toEqual({
      x: 0,
      y: 0,
      key: '0,0',
    });
    expect(geometry.pointToGrid(point.x + tolerance * 0.46, point.y)).toBeNull();
    expect(geometry.pointToGrid(-5, -5)).toBeNull();
  });
});
