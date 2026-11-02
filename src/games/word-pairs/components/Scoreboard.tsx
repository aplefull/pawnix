// LIBRARIES
import cx from 'clsx';
import { memo } from 'react';
// STORE
import type { Seats } from '@store';
// CONSTANTS
import { SEATS } from '../constants';
// TYPES
import type { Scores, Seat } from '../types';
// STYLES
import styles from '@styles/games/word-pairs/game.module.scss';

type TScoreboardProps = {
  round: number;
  totalRounds: number;
  names: Seats;
  scores: Scores;
  seat: Seat;
  activeSeat: Seat | null;
};

export const Scoreboard = memo(({ round, totalRounds, names, scores, seat, activeSeat }: TScoreboardProps) => {
  return (
    <header className={styles.scoreboard}>
      <span className={styles.round}>
        Round {round}/{totalRounds}
      </span>
      <div className={styles.players}>
        {SEATS.map((value) => (
          <div key={value} className={cx(styles.player, { [styles.active]: value === activeSeat })}>
            <span className={styles.playerName}>{names[value] ?? 'Waiting...'}</span>
            {value === seat && <span className={styles.you}>you</span>}
            <span className={styles.score}>{scores[value]}</span>
          </div>
        ))}
      </div>
    </header>
  );
});
