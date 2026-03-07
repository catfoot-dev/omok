import type { StoneColor } from '@/lib/game/types';

export const GRID_SIZE = 15;
export const CENTER_POINT = Math.floor(GRID_SIZE / 2);
export const STAR_POINTS = [3, 7, 11];

export const LINE_DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

export const TURN_LABELS: Record<StoneColor, string> = {
  0: '흑돌',
  1: '백돌',
};

export const STONE_LABELS: Record<StoneColor, string> = {
  0: '흑',
  1: '백',
};
