// LIBRARIES
import cx from 'clsx';
import { memo } from 'react';
// STORE
import type { Seats } from '@store';
// HOOKS
import { useIsOnline } from '@hooks';
// CONSTANTS
import { SEATS } from '../constants';
// TYPES
import type { Scores, Seat } from '../types';
// STYLES
import styles from '@styles/games/word-pairs/game.module.scss';

type TPlayerChipProps = {
  uid: string | null;
  name: string | null;
  score: number;
  isYou: boolean;
  isActive: boolean;
};

type TScoreboardProps = {
  round: number;
  totalRounds: number;
  players: Seats;
  names: Seats;
  scores: Scores;
  seat: Seat;
  activeSeat: Seat | null;
};

const PlayerChip = ({ uid, name, score, isYou, isActive }: TPlayerChipProps) => {
  const isOnline = useIsOnline(uid);

  return (
    <div className={cx(styles.player, { [styles.active]: isActive, [styles.offline]: !isOnline })}>
      <span className={styles.playerName}>{name ?? 'Waiting...'}</span>
      {isYou && <span className={styles.you}>you</span>}
      {!isOnline && <span className={styles.offlineLabel}>offline</span>}
      <span className={styles.score}>{score}</span>
    </div>
  );
};

export const Scoreboard = memo(({ round, totalRounds, players, names, scores, seat, activeSeat }: TScoreboardProps) => {
  return (
    <header className={styles.scoreboard}>
      <span className={styles.round}>
        Round {round}/{totalRounds}
      </span>
      <div className={styles.players}>
        {SEATS.map((value) => (
          <PlayerChip
            key={value}
            uid={players[value]}
            name={names[value]}
            score={scores[value]}
            isYou={value === seat}
            isActive={value === activeSeat}
          />
        ))}
      </div>
    </header>
  );
});
