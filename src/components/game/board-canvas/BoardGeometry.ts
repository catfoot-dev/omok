import { GRID_SIZE } from '@/lib/game/constants';
import { getBoardKey } from '@/lib/game/engine';
import type { BoardKey } from '@/lib/game/types';

export interface BoardHitTarget {
  x: number;
  y: number;
  key: BoardKey;
}

type Point = {
  x: number;
  y: number;
};

export class BoardGeometry {
  private width = 0;
  private height = 0;
  private dpr = 1;
  private cellSize = 0;
  private boardMargin = 0;
  private boardRadius = 0;
  private stoneRadius = 0;
  private lineWidth = 1;

  resize(width: number, height: number, dpr: number): void {
    this.width = Math.max(width, 0);
    this.height = Math.max(height, 0);
    this.dpr = Math.max(dpr || 1, 1);

    const boardExtent = Math.min(this.width, this.height);
    this.cellSize = boardExtent / (GRID_SIZE + 1);
    this.boardMargin = this.cellSize;
    this.boardRadius = Math.max(this.cellSize * 0.5, 12);
    this.stoneRadius = this.cellSize * 0.4;
    this.lineWidth = Math.max(1, this.cellSize * 0.045);
  }

  getCssWidth(): number {
    return this.width;
  }

  getCssHeight(): number {
    return this.height;
  }

  getDpr(): number {
    return this.dpr;
  }

  getCellSize(): number {
    return this.cellSize;
  }

  getBoardMargin(): number {
    return this.boardMargin;
  }

  getBoardRadius(): number {
    return this.boardRadius;
  }

  getStoneRadius(): number {
    return this.stoneRadius;
  }

  getLineWidth(): number {
    return this.lineWidth;
  }

  getBoardStart(): number {
    return this.boardMargin;
  }

  getBoardEnd(): number {
    return this.boardMargin + this.cellSize * (GRID_SIZE - 1);
  }

  getScoreFontSize(): number {
    return Math.max(8, this.cellSize * 0.26);
  }

  getStoneFontSize(): number {
    return Math.max(8, this.cellSize * 0.28);
  }

  gridToPoint(x: number, y: number): Point {
    return {
      x: this.boardMargin + x * this.cellSize,
      y: this.boardMargin + y * this.cellSize,
    };
  }

  pointToGrid(clientX: number, clientY: number): BoardHitTarget | null {
    if (this.cellSize === 0) {
      return null;
    }

    const x = Math.round((clientX - this.boardMargin) / this.cellSize);
    const y = Math.round((clientY - this.boardMargin) / this.cellSize);

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return null;
    }

    const point = this.gridToPoint(x, y);
    const distance = Math.hypot(clientX - point.x, clientY - point.y);
    if (distance > this.cellSize * 0.45) {
      return null;
    }

    return {
      x,
      y,
      key: getBoardKey(x, y),
    };
  }
}
