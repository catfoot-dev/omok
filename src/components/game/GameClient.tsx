'use client';

import * as React from 'react';
import { startTransition, useDeferredValue, useEffectEvent, useReducer, useRef } from 'react';

import { Board } from '@/components/game/Board';
import { ControlPanel } from '@/components/game/ControlPanel';
import { ResultDialog } from '@/components/game/ResultDialog';
import { gameReducer, initialGameState } from '@/components/game/state';
import { STONE_LABELS } from '@/lib/game/constants';
import {
  applyMove,
  boardMapToArray,
  createBoardMap,
  evaluateBoard,
  getOpponentColor,
} from '@/lib/game/engine';
import type { BoardKey, GameRequest, GameResponse, StoneColor, UiStatus } from '@/lib/game/types';

import styles from './GameClient.module.css';

function formatTimedLog(message: string, startedAt: number | null): string {
  if (message.startsWith(' -') || !startedAt) {
    return message;
  }

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  return `${message} - ${elapsedSeconds}s`;
}

function formatMoveLog(
  index: number,
  color: StoneColor,
  x: number,
  y: number,
  startedAt: number | null,
): string {
  return formatTimedLog(`${index}. ${STONE_LABELS[color]} 착수(${y},${x})`, startedAt);
}

function mergeBoards(
  existingBoard: GameResponse['placedStones'],
  newStones: GameResponse['placedStones'],
) {
  return boardMapToArray(createBoardMap([...existingBoard, ...newStones]));
}

function getWinnerFromStatus(status: GameResponse['status']): StoneColor | null {
  if (status === 'victory-black') {
    return 0;
  }

  if (status === 'victory-white') {
    return 1;
  }

  return null;
}

function getUiStatusFromResponse(
  responseStatus: GameResponse['status'],
  mode: 'offline' | 'ai',
  playerColor: StoneColor,
): UiStatus {
  if (responseStatus === 'processing') {
    return 'player-turn';
  }

  if (responseStatus === 'defeat-surrender') {
    return 'defeat';
  }

  if (responseStatus === 'error-occupied') {
    return 'error';
  }

  if (mode === 'offline') {
    return 'victory';
  }

  const winner = getWinnerFromStatus(responseStatus);
  return winner === playerColor ? 'victory' : 'defeat';
}

async function requestGame(payload: GameRequest): Promise<GameResponse> {
  const response = await fetch('/api/game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorPayload?.message ?? '게임 요청에 실패했습니다.');
  }

  return (await response.json()) as GameResponse;
}

export function GameClient() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const logRef = useRef<HTMLTextAreaElement | null>(null);
  const deferredScores = useDeferredValue(state.scores);

  const syncLogScroll = useEffectEvent(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  });

  React.useEffect(() => {
    syncLogScroll();
  }, [state.logLines.length]);

  async function handleStart(): Promise<void> {
    if (state.status !== 'waiting') {
      return;
    }

    const startedAt = Date.now();
    dispatch({
      type: 'patch',
      patch: {
        board: [],
        currentTurn: state.mode === 'offline' ? 0 : state.playerColor,
        errorMessage: null,
        highlightKeys: [],
        illegalPositions: [],
        logLines: [' - 게임을 시작합니다 -'],
        replayIndex: 0,
        scores: {},
        showResultDialog: false,
        startedAt,
        status:
          state.mode === 'offline'
            ? 'player-turn'
            : state.playerColor === 0
              ? 'player-turn'
              : 'ai-turn',
        winner: null,
      },
    });

    if (state.mode === 'ai' && state.playerColor === 1) {
      try {
        const response = await requestGame({
          action: 'start',
          playerColor: state.playerColor,
          board: [],
        });
        const logs = response.placedStones.map((stone) =>
          formatMoveLog(stone.index, stone.color, stone.x, stone.y, startedAt),
        );

        startTransition(() => {
          dispatch({ type: 'appendLogs', lines: logs });
          dispatch({
            type: 'patch',
            patch: {
              board: response.placedStones,
              currentTurn: state.playerColor,
              illegalPositions: response.illegalPositions,
              scores: response.scores,
              status: 'player-turn',
            },
          });
        });
      } catch (error) {
        startTransition(() => {
          dispatch({
            type: 'patch',
            patch: {
              currentTurn: null,
              errorMessage: error instanceof Error ? error.message : '게임 시작에 실패했습니다.',
              status: 'error',
            },
          });
        });
      }
    }
  }

  function finishMatch(
    board: GameResponse['placedStones'],
    responseStatus: GameResponse['status'],
    highlightKeys: BoardKey[],
    illegalPositions: BoardKey[],
    scores: GameResponse['scores'],
    startedAt: number | null,
    extraLogs: string[],
  ): void {
    const winner =
      responseStatus === 'defeat-surrender'
        ? getOpponentColor(state.currentTurn ?? 0)
        : getWinnerFromStatus(responseStatus);

    dispatch({ type: 'appendLogs', lines: extraLogs });
    dispatch({
      type: 'patch',
      patch: {
        board,
        currentTurn: winner,
        highlightKeys,
        illegalPositions,
        replayIndex: board.length,
        scores,
        showResultDialog: true,
        status: getUiStatusFromResponse(responseStatus, state.mode, state.playerColor),
        winner,
      },
    });

    if (winner !== null) {
      dispatch({
        type: 'appendLogs',
        lines: [formatTimedLog(` - ${STONE_LABELS[winner]} 승리! -`, startedAt)],
      });
    }
  }

  function handleOfflineMove(x: number, y: number): void {
    if (state.currentTurn === null || state.status !== 'player-turn') {
      return;
    }

    const board = createBoardMap(state.board);
    const move = applyMove(board, state.currentTurn, x, y);
    if (move.occupied || !move.stone) {
      return;
    }

    const nextBoard = boardMapToArray(move.board);
    const moveLog = formatMoveLog(move.stone.index, move.stone.color, x, y, state.startedAt);
    const outcome = evaluateBoard(move.board, state.currentTurn);

    if (outcome.status !== 'processing') {
      finishMatch(
        nextBoard,
        outcome.status,
        outcome.highlightKeys,
        outcome.illegalPositions,
        outcome.scores,
        state.startedAt,
        [moveLog],
      );
      return;
    }

    const nextTurn = getOpponentColor(state.currentTurn);
    const nextTurnAnalysis = evaluateBoard(move.board, nextTurn);

    dispatch({ type: 'appendLogs', lines: [moveLog] });
    dispatch({
      type: 'patch',
      patch: {
        board: nextBoard,
        currentTurn: nextTurn,
        highlightKeys: [],
        illegalPositions: nextTurnAnalysis.illegalPositions,
        replayIndex: nextBoard.length,
        scores: nextTurnAnalysis.scores,
        status: 'player-turn',
      },
    });
  }

  async function handleAiMove(x: number, y: number): Promise<void> {
    if (state.status !== 'player-turn') {
      return;
    }

    const previousBoard = state.board;
    const previousMap = createBoardMap(previousBoard);
    const optimisticMove = applyMove(previousMap, state.playerColor, x, y);
    if (optimisticMove.occupied || !optimisticMove.stone) {
      return;
    }

    const optimisticBoard = boardMapToArray(optimisticMove.board);
    const playerLog = formatMoveLog(
      optimisticMove.stone.index,
      optimisticMove.stone.color,
      x,
      y,
      state.startedAt,
    );

    dispatch({ type: 'appendLogs', lines: [playerLog] });
    dispatch({
      type: 'patch',
      patch: {
        board: optimisticBoard,
        currentTurn: getOpponentColor(state.playerColor),
        errorMessage: null,
        highlightKeys: [],
        illegalPositions: [],
        replayIndex: optimisticBoard.length,
        scores: {},
        status: 'ai-turn',
      },
    });

    try {
      const response = await requestGame({
        action: 'move',
        playerColor: state.playerColor,
        board: previousBoard,
        move: { x, y },
      });

      const mergedBoard = mergeBoards(optimisticBoard, response.placedStones);
      const aiLogs = response.placedStones
        .filter((stone) => stone.index > optimisticBoard.length)
        .map((stone) => formatMoveLog(stone.index, stone.color, stone.x, stone.y, state.startedAt));
      const winner = getWinnerFromStatus(response.status);

      startTransition(() => {
        if (aiLogs.length > 0) {
          dispatch({ type: 'appendLogs', lines: aiLogs });
        }

        if (response.status !== 'processing') {
          dispatch({
            type: 'patch',
            patch: {
              board: mergedBoard,
              currentTurn: winner,
              errorMessage:
                response.status === 'error-occupied' ? '이미 돌이 놓인 자리입니다.' : null,
              highlightKeys: response.highlightKeys,
              illegalPositions: response.illegalPositions,
              replayIndex: mergedBoard.length,
              scores: response.scores,
              showResultDialog: response.status !== 'error-occupied',
              status: getUiStatusFromResponse(response.status, 'ai', state.playerColor),
              winner,
            },
          });

          if (winner !== null) {
            dispatch({
              type: 'appendLogs',
              lines: [formatTimedLog(` - ${STONE_LABELS[winner]} 승리! -`, state.startedAt)],
            });
          }
          return;
        }

        dispatch({
          type: 'patch',
          patch: {
            board: mergedBoard,
            currentTurn: state.playerColor,
            highlightKeys: [],
            illegalPositions: response.illegalPositions,
            replayIndex: mergedBoard.length,
            scores: response.scores,
            status: 'player-turn',
          },
        });
      });
    } catch (error) {
      startTransition(() => {
        dispatch({
          type: 'appendLogs',
          lines: [formatTimedLog(' - AI 요청에 실패했습니다 -', state.startedAt)],
        });
        dispatch({
          type: 'patch',
          patch: {
            board: previousBoard,
            currentTurn: state.playerColor,
            errorMessage: error instanceof Error ? error.message : 'AI 요청에 실패했습니다.',
            status: 'player-turn',
          },
        });
      });
    }
  }

  async function handlePlaceStone(x: number, y: number): Promise<void> {
    if (state.mode === 'offline') {
      handleOfflineMove(x, y);
      return;
    }

    await handleAiMove(x, y);
  }

  async function handlePrimaryAction(): Promise<void> {
    if (state.status === 'waiting') {
      await handleStart();
      return;
    }

    if (state.status === 'player-turn') {
      const winner = state.currentTurn === null ? null : getOpponentColor(state.currentTurn);
      dispatch({
        type: 'appendLogs',
        lines: [
          formatTimedLog(' - 플레이어가 기권했습니다 -', state.startedAt),
          ...(winner !== null
            ? [formatTimedLog(` - ${STONE_LABELS[winner]} 승리! -`, state.startedAt)]
            : []),
        ],
      });
      dispatch({
        type: 'patch',
        patch: {
          currentTurn: winner,
          replayIndex: state.board.length,
          showResultDialog: true,
          status: state.mode === 'offline' ? 'victory' : 'defeat',
          winner,
        },
      });
      return;
    }

    dispatch({ type: 'restart' });
  }

  const showStoneIndices =
    (state.status === 'victory' || state.status === 'defeat') && !state.showResultDialog;
  const visibleIndex = showStoneIndices ? state.replayIndex : state.board.length;

  return (
    <div className={styles.gameShell}>
      <Board
        board={state.board}
        currentTurn={state.currentTurn}
        disabled={state.status !== 'player-turn' || showStoneIndices}
        highlightKeys={state.highlightKeys}
        illegalPositions={state.illegalPositions}
        scores={deferredScores}
        showStoneIndices={showStoneIndices}
        visibleIndex={visibleIndex}
        onPlaceStone={(x, y) => {
          void handlePlaceStone(x, y);
        }}
      />
      <ControlPanel
        currentTurn={state.currentTurn}
        errorMessage={state.errorMessage}
        logRef={logRef}
        logText={state.logLines.join('\n')}
        maxReplayIndex={state.board.length}
        mode={state.mode}
        moveCount={state.board.length}
        playerColor={state.playerColor}
        replayIndex={state.replayIndex}
        status={state.status}
        winner={state.winner}
        onModeChange={(mode) => dispatch({ type: 'setMode', mode })}
        onPlayerColorChange={(color) => dispatch({ type: 'setPlayerColor', color })}
        onPrimaryAction={() => {
          void handlePrimaryAction();
        }}
        onReplayBackward={() =>
          dispatch({
            type: 'patch',
            patch: {
              replayIndex: Math.max(1, state.replayIndex - 1),
            },
          })
        }
        onReplayForward={() =>
          dispatch({
            type: 'patch',
            patch: {
              replayIndex: Math.min(state.board.length, state.replayIndex + 1),
            },
          })
        }
      />
      <ResultDialog
        open={state.showResultDialog}
        winner={state.winner}
        onClose={() =>
          dispatch({
            type: 'patch',
            patch: {
              replayIndex: state.board.length,
              showResultDialog: false,
            },
          })
        }
      />
    </div>
  );
}
