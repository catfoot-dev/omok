import { CENTER_POINT, GRID_SIZE, LINE_DIRECTIONS } from '@/lib/game/constants';
import type {
  BoardKey,
  BoardMap,
  EvaluationResult,
  ScoreMap,
  StoneColor,
  StonePoint,
} from '@/lib/game/types';

type ScanResult = {
  count: number;
  openKey: BoardKey | null;
  points: StonePoint[];
};

type ColorMaps = Record<StoneColor, ScoreMap>;

function createEmptyScoreMaps(): ColorMaps {
  return { 0: {}, 1: {} };
}

function getCeilScore(value: number): number {
  return Math.ceil(value);
}

export function getBoardKey(x: number, y: number): BoardKey {
  return `${y},${x}`;
}

export function isStoneColor(value: unknown): value is StoneColor {
  return value === 0 || value === 1;
}

export function getOpponentColor(color: StoneColor): StoneColor {
  return color === 0 ? 1 : 0;
}

export function isInsideBoard(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

export function sortStones(stones: StonePoint[]): StonePoint[] {
  return [...stones].sort((left, right) => left.index - right.index);
}

export function createBoardMap(stones: StonePoint[]): BoardMap {
  return stones.reduce<BoardMap>((board, stone) => {
    board[getBoardKey(stone.x, stone.y)] = stone;
    return board;
  }, {});
}

export function boardMapToArray(board: BoardMap): StonePoint[] {
  return sortStones(Object.values(board));
}

export function getNextIndex(board: BoardMap): number {
  return Object.keys(board).length + 1;
}

function scanDirection(board: BoardMap, stone: StonePoint, dx: number, dy: number): ScanResult {
  const points: StonePoint[] = [];

  for (let step = 1; step < 5; step += 1) {
    const x = stone.x + dx * step;
    const y = stone.y + dy * step;

    if (!isInsideBoard(x, y)) {
      return { count: points.length, openKey: null, points };
    }

    const candidate = board[getBoardKey(x, y)];
    if (!candidate) {
      return { count: points.length, openKey: getBoardKey(x, y), points };
    }

    if (candidate.color !== stone.color) {
      return { count: points.length, openKey: null, points };
    }

    points.push(candidate);
  }

  return { count: points.length, openKey: null, points };
}

function getWinningLine(
  pointsBefore: StonePoint[],
  center: StonePoint,
  pointsAfter: StonePoint[],
): BoardKey[] {
  const fullLine = [...pointsBefore.slice().reverse(), center, ...pointsAfter];
  if (fullLine.length <= 5) {
    return fullLine.map((point) => getBoardKey(point.x, point.y));
  }

  const centerIndex = pointsBefore.length;
  let start = Math.max(0, centerIndex - 4);
  if (start + 5 > fullLine.length) {
    start = fullLine.length - 5;
  }

  return fullLine.slice(start, start + 5).map((point) => getBoardKey(point.x, point.y));
}

function updateScoreMap(scoreMap: ScoreMap, key: BoardKey, score: number): void {
  const current = scoreMap[key] ?? 0;
  scoreMap[key] = Math.max(current, score);
}

function updateThreatMap(threatMap: ScoreMap, key: BoardKey, score: number): void {
  if (getCeilScore(score) !== 2) {
    return;
  }

  threatMap[key] = (threatMap[key] ?? 0) + 1;
}

export function evaluateBoard(board: BoardMap, activeColor: StoneColor): EvaluationResult {
  const scoreMaps = createEmptyScoreMaps();
  const threatMaps = createEmptyScoreMaps();

  for (const stone of Object.values(board)) {
    for (const [dx, dy] of LINE_DIRECTIONS) {
      const backward = scanDirection(board, stone, -dx, -dy);
      const forward = scanDirection(board, stone, dx, dy);
      const contiguousCount = backward.count + forward.count;

      if (contiguousCount >= 4) {
        return {
          status: stone.color === 0 ? 'victory-black' : 'victory-white',
          highlightKeys: getWinningLine(backward.points, stone, forward.points),
          illegalPositions: [],
          scores: {},
        };
      }

      const score = contiguousCount + (stone.color === activeColor ? 0.9 : 1);
      for (const openKey of [backward.openKey, forward.openKey]) {
        if (!openKey) {
          continue;
        }

        updateThreatMap(threatMaps[stone.color], openKey, score);
        updateScoreMap(scoreMaps[stone.color], openKey, score);
      }
    }
  }

  const scores: ScoreMap = {};

  for (const [rawKey, rawValue] of Object.entries(scoreMaps[0])) {
    const key = rawKey as BoardKey;
    const value = activeColor === 0 && rawValue <= 2 ? 0.9 : rawValue;
    scores[key] = value;
  }

  for (const [rawKey, rawValue] of Object.entries(scoreMaps[1])) {
    const key = rawKey as BoardKey;
    const value = activeColor === 1 && rawValue <= 2 ? 0.9 : rawValue;
    scores[key] = Math.max(value, scores[key] ?? 0);
  }

  const illegalPositions = new Set<BoardKey>();
  for (const color of [0, 1] as const) {
    for (const [rawKey, rawValue] of Object.entries(threatMaps[color])) {
      const key = rawKey as BoardKey;
      if (rawValue === 4) {
        illegalPositions.add(key);
        scores[key] = Number.NEGATIVE_INFINITY;
      }
    }
  }

  return {
    status: 'processing',
    highlightKeys: [],
    illegalPositions: [...illegalPositions],
    scores,
  };
}

export function applyMove(
  board: BoardMap,
  color: StoneColor,
  x: number,
  y: number,
): { board: BoardMap; stone: StonePoint | null; occupied: boolean } {
  const key = getBoardKey(x, y);
  if (!isInsideBoard(x, y) || board[key]) {
    return { board, stone: null, occupied: true };
  }

  const stone: StonePoint = {
    color,
    index: getNextIndex(board),
    x,
    y,
  };

  return {
    board: {
      ...board,
      [key]: stone,
    },
    stone,
    occupied: false,
  };
}

function compareCandidate(left: [string, number], right: [string, number]): number {
  if (right[1] !== left[1]) {
    return right[1] - left[1];
  }

  const [leftY, leftX] = left[0].split(',').map(Number);
  const [rightY, rightX] = right[0].split(',').map(Number);
  const leftDistance = Math.abs(leftX - CENTER_POINT) + Math.abs(leftY - CENTER_POINT);
  const rightDistance = Math.abs(rightX - CENTER_POINT) + Math.abs(rightY - CENTER_POINT);

  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  if (leftY !== rightY) {
    return leftY - rightY;
  }

  return leftX - rightX;
}

export function pickAiMove(board: BoardMap, scores: ScoreMap): { x: number; y: number } {
  const taken = new Set(Object.keys(board));
  const candidates = Object.entries(scores)
    .filter(([key, score]) => Number.isFinite(score) && !taken.has(key))
    .sort(compareCandidate);

  if (candidates.length > 0) {
    const [y, x] = candidates[0][0].split(',').map(Number);
    return { x, y };
  }

  const fallbackCandidates: [BoardKey, number][] = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const key = getBoardKey(x, y);
      if (!taken.has(key)) {
        fallbackCandidates.push([key, 0]);
      }
    }
  }

  fallbackCandidates.sort(compareCandidate);
  const [fallbackY, fallbackX] = fallbackCandidates[0][0].split(',').map(Number);
  return { x: fallbackX, y: fallbackY };
}
