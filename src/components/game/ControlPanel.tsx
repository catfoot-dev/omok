import type { RefObject } from 'react';

import { STONE_LABELS, TURN_LABELS } from '@/lib/game/constants';
import type { GameMode, StoneColor, UiStatus } from '@/lib/game/types';

import styles from './GameClient.module.css';

type ControlPanelProps = {
  mode: GameMode;
  playerColor: StoneColor;
  currentTurn: StoneColor | null;
  status: UiStatus;
  moveCount: number;
  replayIndex: number;
  maxReplayIndex: number;
  winner: StoneColor | null;
  logText: string;
  errorMessage: string | null;
  onModeChange: (mode: GameMode) => void;
  onPlayerColorChange: (color: StoneColor) => void;
  onPrimaryAction: () => void;
  onReplayBackward: () => void;
  onReplayForward: () => void;
  logRef: RefObject<HTMLTextAreaElement | null>;
};

function getTurnDescription(
  mode: GameMode,
  status: UiStatus,
  currentTurn: StoneColor | null,
  winner: StoneColor | null,
): string {
  if (status === 'victory' || status === 'defeat') {
    return winner === null ? '게임 종료' : `${TURN_LABELS[winner]} 승리!`;
  }

  if (status === 'error') {
    return '오류 발생';
  }

  if (currentTurn === null) {
    return '대기 중';
  }

  if (mode === 'offline') {
    return `${TURN_LABELS[currentTurn]} 차례`;
  }

  if (status === 'ai-turn') {
    return `${TURN_LABELS[currentTurn]}(AI) 차례`;
  }

  return `${TURN_LABELS[currentTurn]}(플레이어) 차례`;
}

function getPrimaryLabel(status: UiStatus): string {
  if (status === 'waiting') {
    return '시작하기';
  }

  if (status === 'player-turn') {
    return '포기하기';
  }

  if (status === 'ai-turn') {
    return 'AI 계산 중...';
  }

  return '처음으로';
}

export function ControlPanel({
  mode,
  playerColor,
  currentTurn,
  status,
  moveCount,
  replayIndex,
  maxReplayIndex,
  winner,
  logText,
  errorMessage,
  onModeChange,
  onPlayerColorChange,
  onPrimaryAction,
  onReplayBackward,
  onReplayForward,
  logRef,
}: ControlPanelProps) {
  const isWaiting = status === 'waiting';
  const canReplay = status === 'victory' || status === 'defeat';

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>React + Next.js</p>
        <h1 className={styles.title}>오목</h1>
      </div>

      <section className={styles.optionBlock}>
        <p className={styles.optionTitle}>게임 방법</p>
        <label className={styles.radioLabel}>
          <input
            checked={mode === 'offline'}
            disabled={!isWaiting}
            name="mode"
            type="radio"
            onChange={() => onModeChange('offline')}
          />
          <span>로컬 2인</span>
        </label>
        <label className={styles.radioLabel}>
          <input
            checked={mode === 'ai'}
            disabled={!isWaiting}
            name="mode"
            type="radio"
            onChange={() => onModeChange('ai')}
          />
          <span>vs AI</span>
        </label>
      </section>

      {mode === 'ai' ? (
        <section className={styles.optionBlock}>
          <p className={styles.optionTitle}>플레이어 색상</p>
          <label className={styles.radioLabel}>
            <input
              checked={playerColor === 0}
              disabled={!isWaiting}
              name="color"
              type="radio"
              onChange={() => onPlayerColorChange(0)}
            />
            <span>{STONE_LABELS[0]}돌</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              checked={playerColor === 1}
              disabled={!isWaiting}
              name="color"
              type="radio"
              onChange={() => onPlayerColorChange(1)}
            />
            <span>{STONE_LABELS[1]}돌</span>
          </label>
        </section>
      ) : null}

      {canReplay ? (
        <div className={styles.replayControls}>
          <button disabled={replayIndex <= 1} type="button" onClick={onReplayBackward}>
            ⇦ 뒷 수
          </button>
          <button disabled={replayIndex >= maxReplayIndex} type="button" onClick={onReplayForward}>
            ⇨ 앞 수
          </button>
        </div>
      ) : null}

      <button
        className={styles.primaryButton}
        disabled={status === 'ai-turn'}
        type="button"
        onClick={onPrimaryAction}
      >
        {getPrimaryLabel(status)}
      </button>

      <section className={styles.statusCard}>
        <p>{getTurnDescription(mode, status, currentTurn, winner)}</p>
        <p className={styles.moveCount}>{moveCount} 수</p>
        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
        <textarea
          aria-label="게임 로그"
          className={styles.logArea}
          ref={logRef}
          readOnly
          value={logText}
        />
      </section>
    </aside>
  );
}
