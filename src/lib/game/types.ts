export type StoneColor = 0 | 1;
export type GameMode = 'offline' | 'ai';
export type GameStatus =
  | 'processing'
  | 'victory-black'
  | 'victory-white'
  | 'defeat-surrender'
  | 'error-occupied';
export type UiStatus = 'waiting' | 'player-turn' | 'ai-turn' | 'victory' | 'defeat' | 'error';

export type BoardKey = `${number},${number}`;

export interface StonePoint {
  color: StoneColor;
  index: number;
  x: number;
  y: number;
}

export type BoardMap = Record<BoardKey, StonePoint>;
export type ScoreMap = Record<BoardKey, number>;

export interface GameMove {
  x: number;
  y: number;
}

export interface GameRequest {
  action: 'start' | 'move' | 'surrender';
  playerColor: StoneColor;
  board: StonePoint[];
  move?: GameMove;
}

export interface GameResponse {
  status: GameStatus;
  placedStones: StonePoint[];
  highlightKeys: BoardKey[];
  illegalPositions: BoardKey[];
  scores: ScoreMap;
}

export interface EvaluationResult {
  status: Extract<GameStatus, 'processing' | 'victory-black' | 'victory-white'>;
  highlightKeys: BoardKey[];
  illegalPositions: BoardKey[];
  scores: ScoreMap;
}
