// LIBRARIES
import cx from 'clsx';
import { memo } from 'react';
// STORE
import type { Player, Position } from '../types';
// UTILS
import { getGridPlacement } from '../utils';
// COMPONENTS
import { Pawn } from './Pawn';
// CONSTANTS
import { PLAYERS } from '../constants';
// STYLES
import styles from '@styles/games/quoridor/cell.module.scss';

type TCellProps = {
  position: Position;
  isFlipped: boolean;
  occupant: Player | null;
  goalOf: Player | null;
  canMoveHere: boolean;
  player: Player;
  onMove: (position: Position) => void;
};

export const Cell = memo(({ position, isFlipped, occupant, goalOf, canMoveHere, player, onMove }: TCellProps) => {
  const handleClick = () => {
    onMove(position);
  };

  return (
    <button
      type="button"
      className={cx(styles.cell, {
        [styles.goalOne]: goalOf === PLAYERS.PLAYER_1,
        [styles.goalTwo]: goalOf === PLAYERS.PLAYER_2,
      })}
      style={getGridPlacement(position, isFlipped)}
      disabled={!canMoveHere}
      onClick={handleClick}
      aria-label={canMoveHere ? 'Move here' : undefined}
    >
      {occupant && <Pawn player={occupant} className={styles.pawn} />}
      {canMoveHere && (
        <span className={cx(styles.moveHint, player === PLAYERS.PLAYER_1 ? styles.hintOne : styles.hintTwo)} />
      )}
    </button>
  );
});
