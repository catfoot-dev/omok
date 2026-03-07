import type { BoardKey, BoardMap, StoneColor } from '@/lib/game/types';

export type BoardScoreMap = Map<BoardKey, number>;

export interface BoardRenderState {
  visibleBoard: BoardMap;
  currentTurn: StoneColor | null;
  disabled: boolean;
  highlightSet: Set<BoardKey>;
  illegalSet: Set<BoardKey>;
  scoreMap: BoardScoreMap;
  showStoneIndices: boolean;
  hoveredKey: BoardKey | null;
}

export interface BoardSceneCanvases {
  background: HTMLCanvasElement;
  overlay: HTMLCanvasElement;
  interaction: HTMLCanvasElement;
}
