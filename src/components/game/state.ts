import type {
  BoardKey,
  GameMode,
  ScoreMap,
  StoneColor,
  StonePoint,
  UiStatus,
} from '@/lib/game/types';

export interface GameState {
  mode: GameMode;
  playerColor: StoneColor;
  currentTurn: StoneColor | null;
  status: UiStatus;
  board: StonePoint[];
  highlightKeys: BoardKey[];
  illegalPositions: BoardKey[];
  scores: ScoreMap;
  replayIndex: number;
  logLines: string[];
  startedAt: number | null;
  winner: StoneColor | null;
  showResultDialog: boolean;
  errorMessage: string | null;
}

export const initialGameState: GameState = {
  mode: 'ai',
  playerColor: 0,
  currentTurn: null,
  status: 'waiting',
  board: [],
  highlightKeys: [],
  illegalPositions: [],
  scores: {},
  replayIndex: 0,
  logLines: [],
  startedAt: null,
  winner: null,
  showResultDialog: false,
  errorMessage: null,
};

type Action =
  | { type: 'setMode'; mode: GameMode }
  | { type: 'setPlayerColor'; color: StoneColor }
  | { type: 'patch'; patch: Partial<GameState> }
  | { type: 'appendLogs'; lines: string[] }
  | { type: 'restart' };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'setMode':
      if (state.status !== 'waiting') {
        return state;
      }

      return {
        ...state,
        mode: action.mode,
      };
    case 'setPlayerColor':
      if (state.status !== 'waiting') {
        return state;
      }

      return {
        ...state,
        playerColor: action.color,
      };
    case 'patch':
      return {
        ...state,
        ...action.patch,
      };
    case 'appendLogs':
      return {
        ...state,
        logLines: [...state.logLines, ...action.lines],
      };
    case 'restart':
      return {
        ...initialGameState,
        mode: state.mode,
        playerColor: state.playerColor,
      };
    default:
      return state;
  }
}
