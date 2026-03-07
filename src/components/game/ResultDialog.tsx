import { TURN_LABELS } from '@/lib/game/constants';
import type { StoneColor } from '@/lib/game/types';

import styles from './GameClient.module.css';

type ResultDialogProps = {
  open: boolean;
  winner: StoneColor | null;
  onClose: () => void;
};

export function ResultDialog({ open, winner, onClose }: ResultDialogProps) {
  if (!open || winner === null) {
    return null;
  }

  return (
    <div className={styles.resultBackdrop} role="presentation">
      <div aria-modal="true" className={styles.resultDialog} role="dialog">
        <p className={styles.resultCaption}>경기 종료</p>
        <h2>{TURN_LABELS[winner]} 승리</h2>
        <button type="button" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}
