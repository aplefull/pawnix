// LIBRARIES
import cx from 'classnames';
import { memo } from 'react';
// REDUX
import { Player } from '@redux';
// COMPONENTS
import { Pawn } from '@components';
// CONSTANTS
import { WALLS_PER_PLAYER } from '@constants';
// STYLES
import styles from '@styles/components/player-bar.module.scss';

type TPlayerBarProps = {
  player: Player;
  isYou: boolean;
  isActive: boolean;
  wallsLeft: number;
};

export const PlayerBar = memo(({ player, isYou, isActive, wallsLeft }: TPlayerBarProps) => {
  const turnText = isYou ? 'Your turn' : 'Their turn';

  return (
    <div className={cx(styles.bar, { [styles.active]: isActive })}>
      <Pawn player={player} className={styles.pawn} />

      <span className={styles.name}>{isYou ? 'You' : 'Opponent'}</span>

      {isActive && <span className={styles.turn}>{turnText}</span>}

      <div className={styles.walls} title={`${wallsLeft} walls left`}>
        <div className={styles.pips} aria-hidden>
          {Array.from({ length: WALLS_PER_PLAYER }, (_, i) => (
            <span key={i} className={cx(styles.pip, { [styles.used]: i >= wallsLeft })} />
          ))}
        </div>
        <span className={styles.wallsCount}>{wallsLeft}</span>
      </div>
    </div>
  );
});
