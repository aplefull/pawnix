// LIBRARIES
import { Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Await, useLoaderData } from 'react-router';
// REDUX
import { type Player, restartGame, type AppDispatch, type RootState } from '@redux';
// UTILS
import { isCurrentPlayerTurn, logger } from '@utils';
// COMPONENTS
import { Button, Gif, Panel, PlayerBar, Playfield, Spinner } from '@components';
// CONSTANTS
import { PLAYERS } from '@constants';
// STYLES
import styles from '@styles/pages/play-page.module.scss';

type TEndScreenProps = {
  winner: Player;
  player: Player;
};

const EndScreen = ({ winner, player }: TEndScreenProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const isWinner = winner === player;

  const handleRestart = () => {
    dispatch(restartGame());
  };

  return (
    <div className={styles.overlay}>
      <Panel className={styles.endScreen}>
        <h2 className={styles.result}>{isWinner ? 'You won!' : 'You lost'}</h2>
        <p className={styles.resultText}>{isWinner ? 'Nicely done, congrats!' : "You'll get it next time..."}</p>
        <Gif isWinner={isWinner} />
        <Button size="lg" fullWidth onClick={handleRestart}>
          Rematch
        </Button>
      </Panel>
    </div>
  );
};

const Game = () => {
  const { winner, turn, player, playerOneWallsLeft, playerTwoWallsLeft } = useSelector(
    (state: RootState) => state.playfield
  );

  const opponent = player === PLAYERS.PLAYER_1 ? PLAYERS.PLAYER_2 : PLAYERS.PLAYER_1;
  const ownWalls = player === PLAYERS.PLAYER_1 ? playerOneWallsLeft : playerTwoWallsLeft;
  const opponentWalls = player === PLAYERS.PLAYER_1 ? playerTwoWallsLeft : playerOneWallsLeft;
  const isYourTurn = isCurrentPlayerTurn(turn, player);

  return (
    <>
      <PlayerBar player={opponent} isYou={false} isActive={!winner && !isYourTurn} wallsLeft={opponentWalls} />
      <div className={styles.board}>
        <Playfield />
        {winner && <EndScreen winner={winner} player={player} />}
      </div>
      <PlayerBar player={player} isYou isActive={!winner && isYourTurn} wallsLeft={ownWalls} />
    </>
  );
};

export const PlayPage = () => {
  const data = useLoaderData();

  if (!data || typeof data !== 'object' || !('promise' in data)) {
    logger.error('useLoaderData returned invalid data', data);
    return null;
  }

  return (
    <div className={styles.page}>
      <Suspense
        fallback={
          <div className={styles.loader}>
            <Spinner />
          </div>
        }
      >
        <Await resolve={data.promise}>
          <Game />
        </Await>
      </Suspense>
    </div>
  );
};
