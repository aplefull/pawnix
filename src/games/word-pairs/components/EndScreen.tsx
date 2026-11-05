// LIBRARIES
import { useState } from 'react';
import { useNavigate } from 'react-router';
// STORE
import type { Seats } from '@store';
import { restartGame } from '../store';
// COMPONENTS
import { Button, Gif, Panel } from '@components';
// UTILS
import { logger } from '@utils';
import { getOtherSeat } from '../utils';
// TYPES
import type { Scores, Seat } from '../types';
// STYLES
import styles from '@styles/games/word-pairs/game.module.scss';

type TEndScreenProps = {
  seat: Seat;
  names: Seats;
  scores: Scores;
};

const getResult = (own: number, other: number) => {
  if (own === other) return "It's a tie!";
  return own > other ? 'You won!' : 'You lost';
};

export const EndScreen = ({ seat, names, scores }: TEndScreenProps) => {
  const navigate = useNavigate();

  const [restarting, setRestarting] = useState(false);

  const opponent = getOtherSeat(seat);
  const own = scores[seat];
  const other = scores[opponent];

  const handleRestart = async () => {
    setRestarting(true);

    try {
      await restartGame();
    } catch (error) {
      logger.error(error);
      setRestarting(false);
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <Panel className={styles.endScreen}>
      <h2 className={styles.result}>{getResult(own, other)}</h2>
      <p className={styles.finalScore}>
        {names[seat]} {own} : {other} {names[opponent]}
      </p>
      <Gif isWinner={own >= other} />
      <Button size="lg" fullWidth disabled={restarting} onClick={handleRestart}>
        Rematch
      </Button>
      <Button variant="secondary" size="lg" fullWidth onClick={handleHome}>
        Home
      </Button>
    </Panel>
  );
};
