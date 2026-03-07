'use client';

import * as React from 'react';

import { GRID_SIZE } from '@/lib/game/constants';
import { createBoardMap } from '@/lib/game/engine';
import type { BoardKey, ScoreMap, StoneColor, StonePoint } from '@/lib/game/types';

import { BoardScene } from './board-canvas/BoardScene';
import type { BoardRenderState } from './board-canvas/types';
import styles from './GameClient.module.css';

type BoardProps = {
  board: StonePoint[];
  currentTurn: StoneColor | null;
  disabled: boolean;
  highlightKeys: BoardKey[];
  illegalPositions: BoardKey[];
  scores: ScoreMap;
  showStoneIndices: boolean;
  visibleIndex: number;
  onPlaceStone: (x: number, y: number) => void;
};

export function Board({
  board,
  currentTurn,
  disabled,
  highlightKeys,
  illegalPositions,
  scores,
  showStoneIndices,
  visibleIndex,
  onPlaceStone,
}: BoardProps) {
  const onPlaceStoneRef = React.useRef(onPlaceStone);
  const stackRef = React.useRef<HTMLDivElement | null>(null);
  const backgroundCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const interactionCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const sceneRef = React.useRef<BoardScene | null>(null);

  const renderState = React.useMemo<BoardRenderState>(
    () => ({
      visibleBoard: createBoardMap(board.filter((stone) => stone.index <= visibleIndex)),
      currentTurn,
      disabled,
      highlightSet: new Set(highlightKeys),
      illegalSet: new Set(illegalPositions),
      scoreMap: new Map(Object.entries(scores) as [BoardKey, number][]),
      showStoneIndices,
      hoveredKey: null,
    }),
    [
      board,
      currentTurn,
      disabled,
      highlightKeys,
      illegalPositions,
      scores,
      showStoneIndices,
      visibleIndex,
    ],
  );

  React.useEffect(() => {
    onPlaceStoneRef.current = onPlaceStone;
  }, [onPlaceStone]);

  React.useEffect(() => {
    const stack = stackRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const interactionCanvas = interactionCanvasRef.current;

    if (!stack || !backgroundCanvas || !overlayCanvas || !interactionCanvas) {
      return;
    }

    const scene = new BoardScene({
      onPlaceStone: (x, y) => {
        onPlaceStoneRef.current(x, y);
      },
    });
    scene.mount(
      {
        background: backgroundCanvas,
        overlay: overlayCanvas,
        interaction: interactionCanvas,
      },
      stack,
    );
    sceneRef.current = scene;

    const resizeScene = () => {
      const rect = stack.getBoundingClientRect();
      scene.resize(rect.width, rect.height, window.devicePixelRatio || 1);
    };

    resizeScene();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resizeScene();
      });
      resizeObserver.observe(stack);
    } else {
      window.addEventListener('resize', resizeScene);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resizeScene);
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    sceneRef.current?.sync(renderState);
  }, [renderState]);

  return (
    <div className={styles.boardShell}>
      <div className={styles.columnLabels}>
        {Array.from({ length: GRID_SIZE }, (_, index) => (
          <span key={`column-${index}`}>{index}</span>
        ))}
      </div>
      <div className={styles.boardBody}>
        <div className={styles.rowLabels}>
          {Array.from({ length: GRID_SIZE }, (_, index) => (
            <span key={`row-${index}`}>{index}</span>
          ))}
        </div>
        <div ref={stackRef} className={styles.boardCanvasStack} data-testid="board-canvas-stack">
          <canvas ref={backgroundCanvasRef} aria-hidden="true" className={styles.canvasLayer} />
          <canvas ref={overlayCanvasRef} aria-hidden="true" className={styles.canvasLayer} />
          <canvas
            ref={interactionCanvasRef}
            aria-label="오목판"
            className={`${styles.canvasLayer} ${styles.interactionLayer}`}
            data-testid="board-interaction-layer"
            onClick={(event) => {
              sceneRef.current?.handleClick(event.nativeEvent);
            }}
            onPointerLeave={() => {
              sceneRef.current?.handlePointerLeave();
            }}
            onPointerMove={(event) => {
              sceneRef.current?.handlePointerMove(event.nativeEvent);
            }}
          >
            오목판
          </canvas>
        </div>
      </div>
    </div>
  );
}
