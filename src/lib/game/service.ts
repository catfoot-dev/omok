import { CENTER_POINT } from '@/lib/game/constants';
import {
  applyMove,
  createBoardMap,
  evaluateBoard,
  getOpponentColor,
  isInsideBoard,
  isStoneColor,
  pickAiMove,
} from '@/lib/game/engine';
import type { GameRequest, GameResponse, StonePoint } from '@/lib/game/types';

export class InvalidGameRequestError extends Error {}

function isStonePoint(value: unknown): value is StonePoint {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    isStoneColor(candidate.color) &&
    Number.isInteger(candidate.index) &&
    Number.isInteger(candidate.x) &&
    Number.isInteger(candidate.y) &&
    isInsideBoard(candidate.x as number, candidate.y as number)
  );
}

function assertValidRequest(payload: unknown): asserts payload is GameRequest {
  if (typeof payload !== 'object' || payload === null) {
    throw new InvalidGameRequestError('요청 본문이 객체여야 합니다.');
  }

  const candidate = payload as Record<string, unknown>;
  if (!['start', 'move', 'surrender'].includes(candidate.action as string)) {
    throw new InvalidGameRequestError('지원하지 않는 action입니다.');
  }

  if (!isStoneColor(candidate.playerColor)) {
    throw new InvalidGameRequestError('playerColor는 0 또는 1이어야 합니다.');
  }

  if (!Array.isArray(candidate.board) || !candidate.board.every(isStonePoint)) {
    throw new InvalidGameRequestError('board는 StonePoint 배열이어야 합니다.');
  }

  if (candidate.action === 'move') {
    if (typeof candidate.move !== 'object' || candidate.move === null) {
      throw new InvalidGameRequestError('move 액션에는 move 좌표가 필요합니다.');
    }

    const move = candidate.move as Record<string, unknown>;
    if (!Number.isInteger(move.x) || !Number.isInteger(move.y)) {
      throw new InvalidGameRequestError('move 좌표는 정수여야 합니다.');
    }

    if (!isInsideBoard(move.x as number, move.y as number)) {
      throw new InvalidGameRequestError('move 좌표가 보드 범위를 벗어났습니다.');
    }
  }
}

function createProcessingResponse(
  placedStones: StonePoint[],
  illegalPositions: GameResponse['illegalPositions'],
  scores: GameResponse['scores'],
): GameResponse {
  return {
    status: 'processing',
    placedStones,
    highlightKeys: [],
    illegalPositions,
    scores,
  };
}

export function processGameRequest(payload: unknown): GameResponse {
  assertValidRequest(payload);

  const aiColor = getOpponentColor(payload.playerColor);
  const board = createBoardMap(payload.board);

  if (payload.action === 'surrender') {
    return {
      status: 'defeat-surrender',
      placedStones: [],
      highlightKeys: [],
      illegalPositions: [],
      scores: {},
    };
  }

  if (payload.action === 'start') {
    if (payload.board.length > 0) {
      throw new InvalidGameRequestError('start 액션은 빈 보드에서만 시작할 수 있습니다.');
    }

    if (payload.playerColor === 0) {
      return createProcessingResponse([], [], {});
    }

    const firstMove = applyMove(board, aiColor, CENTER_POINT, CENTER_POINT);
    if (!firstMove.stone) {
      throw new InvalidGameRequestError('초기 AI 수를 배치할 수 없습니다.');
    }

    const nextTurnAnalysis = evaluateBoard(firstMove.board, payload.playerColor);
    return createProcessingResponse(
      [firstMove.stone],
      nextTurnAnalysis.illegalPositions,
      nextTurnAnalysis.scores,
    );
  }

  const playerMove = applyMove(board, payload.playerColor, payload.move!.x, payload.move!.y);
  if (playerMove.occupied || !playerMove.stone) {
    return {
      status: 'error-occupied',
      placedStones: [],
      highlightKeys: [],
      illegalPositions: [],
      scores: {},
    };
  }

  const playerOutcome = evaluateBoard(playerMove.board, payload.playerColor);
  if (playerOutcome.status !== 'processing') {
    return {
      status: playerOutcome.status,
      placedStones: [playerMove.stone],
      highlightKeys: playerOutcome.highlightKeys,
      illegalPositions: playerOutcome.illegalPositions,
      scores: playerOutcome.scores,
    };
  }

  const aiTurnAnalysis = evaluateBoard(playerMove.board, aiColor);
  const aiMoveTarget = pickAiMove(playerMove.board, aiTurnAnalysis.scores);
  const aiMove = applyMove(playerMove.board, aiColor, aiMoveTarget.x, aiMoveTarget.y);
  if (!aiMove.stone) {
    throw new InvalidGameRequestError('AI가 둘 수 있는 자리가 없습니다.');
  }

  const aiOutcome = evaluateBoard(aiMove.board, aiColor);
  if (aiOutcome.status !== 'processing') {
    return {
      status: aiOutcome.status,
      placedStones: [playerMove.stone, aiMove.stone],
      highlightKeys: aiOutcome.highlightKeys,
      illegalPositions: aiOutcome.illegalPositions,
      scores: aiOutcome.scores,
    };
  }

  const nextTurnAnalysis = evaluateBoard(aiMove.board, payload.playerColor);
  return createProcessingResponse(
    [playerMove.stone, aiMove.stone],
    nextTurnAnalysis.illegalPositions,
    nextTurnAnalysis.scores,
  );
}
