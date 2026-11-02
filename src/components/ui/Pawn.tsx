// LIBRARIES
import cx from 'clsx';
// STORE
import type { Player } from '@store';
// CONSTANTS
import { PLAYERS } from '@constants';
// STYLES
import styles from '@styles/components/ui/pawn.module.scss';

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
