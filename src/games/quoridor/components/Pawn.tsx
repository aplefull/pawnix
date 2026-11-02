// LIBRARIES
import cx from 'clsx';
// STORE
import type { Player } from '../types';
// CONSTANTS
import { PLAYERS } from '../constants';
// STYLES
import styles from '@styles/games/quoridor/pawn.module.scss';

type TPawnProps = {
  player: Player;
  className?: string;
};

export const Pawn = ({ player, className }: TPawnProps) => {
  return (
    <span
      className={cx(styles.pawn, player === PLAYERS.PLAYER_1 ? styles.playerOne : styles.playerTwo, className)}
      aria-hidden
    />
  );
};
