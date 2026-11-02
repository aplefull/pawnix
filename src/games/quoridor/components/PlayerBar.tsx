// LIBRARIES
import cx from 'clsx';
import { memo } from 'react';
// TYPES
import type { Player } from '../types';
// HOOKS
import { useIsOnline } from '@hooks';
// COMPONENTS
import { Pawn } from './Pawn';
// CONSTANTS
import { WALLS_PER_PLAYER } from '../constants';
// STYLES
import styles from '@styles/games/quoridor/player-bar.module.scss';

const PIPS = Array.from({ length: WALLS_PER_PLAYER }, (_, i) => i);

type TPlayerBarProps = {
  player: Player;
  uid: string | null;
  name: string | null;
  isYou: boolean;
  isActive: boolean;
  wallsLeft: number;
};

export const PlayerBar = memo(({ player, uid, name, isYou, isActive, wallsLeft }: TPlayerBarProps) => {
  const isOnline = useIsOnline(uid);

  const turnText = isYou ? 'Your turn' : 'Their turn';
  const fallbackName = isYou ? 'You' : 'Opponent';

  return (
    <div className={cx(styles.bar, { [styles.active]: isActive })}>
      <Pawn player={player} className={styles.pawn} />

      <span className={styles.name}>{name ?? fallbackName}</span>
      {isYou && name && <span className={styles.you}>you</span>}
      {!isOnline && <span className={styles.offline}>offline</span>}

      {isActive && <span className={styles.turn}>{turnText}</span>}

      <div className={styles.walls} title={`${wallsLeft} walls left`}>
        <div className={styles.pips} aria-hidden>
          {PIPS.map((pip) => (
            <span key={pip} className={cx(styles.pip, { [styles.used]: pip >= wallsLeft })} />
          ))}
        </div>
        <span className={styles.wallsCount}>{wallsLeft}</span>
      </div>
    </div>
  );
});
