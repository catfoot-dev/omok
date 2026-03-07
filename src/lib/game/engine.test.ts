import { describe, expect, it } from 'vitest';

import {
  applyMove,
  createBoardMap,
  evaluateBoard,
  getBoardKey,
  pickAiMove,
} from '@/lib/game/engine';
import type { StonePoint } from '@/lib/game/types';

function buildStone(color: 0 | 1, index: number, x: number, y: number): StonePoint {
  return { color, index, x, y };
}

describe('game engine', () => {
  it('detects a horizontal five and returns highlight keys', () => {
    const board = createBoardMap([
      buildStone(0, 1, 3, 7),
      buildStone(0, 2, 4, 7),
      buildStone(0, 3, 5, 7),
      buildStone(0, 4, 6, 7),
      buildStone(0, 5, 7, 7),
    ]);

    const result = evaluateBoard(board, 0);

    expect(result.status).toBe('victory-black');
    expect(result.highlightKeys).toEqual([
      getBoardKey(3, 7),
      getBoardKey(4, 7),
      getBoardKey(5, 7),
      getBoardKey(6, 7),
      getBoardKey(7, 7),
    ]);
  });

  it('marks a double-three position as illegal', () => {
    const board = createBoardMap([
      buildStone(0, 1, 5, 7),
      buildStone(0, 2, 6, 7),
      buildStone(0, 3, 7, 5),
      buildStone(0, 4, 7, 6),
    ]);

    const result = evaluateBoard(board, 0);

    expect(result.illegalPositions).toContain(getBoardKey(7, 7));
    expect(result.scores[getBoardKey(7, 7)]).toBe(Number.NEGATIVE_INFINITY);
  });

  it('rejects moves on occupied positions', () => {
    const board = createBoardMap([buildStone(0, 1, 7, 7)]);
    const result = applyMove(board, 1, 7, 7);

    expect(result.occupied).toBe(true);
    expect(result.stone).toBeNull();
  });

  it('picks the highest score candidate deterministically', () => {
    const board = createBoardMap([
      buildStone(1, 1, 7, 7),
      buildStone(1, 2, 8, 7),
      buildStone(1, 3, 9, 7),
      buildStone(1, 4, 10, 7),
    ]);

    const analysis = evaluateBoard(board, 1);
    const move = pickAiMove(board, analysis.scores);

    expect(move).toEqual({ x: 6, y: 7 });
  });
});
