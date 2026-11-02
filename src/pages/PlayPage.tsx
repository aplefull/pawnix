// LIBRARIES
import { Button, Loader, Paper } from '@mantine/core';
import { ToastContainer } from 'react-toastify';
import React, { Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Await, useLoaderData, useNavigate, useParams } from 'react-router';
// REDUX
import { Player, restartGame, AppDispatch, RootState } from '@redux';
// UTILS
import { isCurrentPlayerTurn, logger } from '@utils';
// COMPONENTS
import { Gif, Playfield } from '@components';
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

  const handleRestart = () => {
    dispatch(restartGame());
  };

  return (
    <Paper className={styles.endScreen}>
      {winner === player ? <p>You won, congrats!</p> : <p>You'll get it next time...</p>}
      <Gif isWinner={winner === player} />
      <Button onClick={handleRestart}>Restart!</Button>
    </Paper>
  );
};

type TPlayScreenProps = {
  player: Player;
  turn: Player;
  playerOneWallsLeft: number;
  playerTwoWallsLeft: number;
};

const PlayScreen = ({ player, playerTwoWallsLeft, playerOneWallsLeft, turn }: TPlayScreenProps) => {
  const opponentWalls = player === PLAYERS.PLAYER_2 ? playerOneWallsLeft : playerTwoWallsLeft;
  const ownWalls = player === PLAYERS.PLAYER_2 ? playerTwoWallsLeft : playerOneWallsLeft;
  const turnText = isCurrentPlayerTurn(player, turn) ? 'Your turn' : "Opponent's turn";

  return (
    <>
      <p className={styles.currentTurn}>{turnText}</p>
      <p className={styles.wallsCount}>{`Opponent's walls: ${opponentWalls}`}</p>
      <Playfield />
      <p className={styles.wallsCount}>{`Your walls: ${ownWalls}`}</p>
    </>
  );
};

export const PlayPage = () => {
  const { winner, turn, player, playerOneWallsLeft, playerTwoWallsLeft } = useSelector(
    (state: RootState) => state.playfield
  );
  const navigate = useNavigate();
  const params = useParams();
  const data = useLoaderData();

  useEffect(() => {
    if (!params.player && player) {
      navigate(`/play/${params.roomId}/${player}`);
    }
  }, []);

  if (!data || typeof data !== 'object' || !('promise' in data)) {
    logger.error('useLoaderData returned invalid data', data);
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Suspense
        fallback={
          <div className={styles.loaderWrapper}>
            <Loader />
          </div>
        }
      >
        <Await resolve={data.promise}>
          <div className={styles.container}>
            {!winner && (
              <PlayScreen
                turn={turn}
                player={player}
                playerOneWallsLeft={playerOneWallsLeft}
                playerTwoWallsLeft={playerTwoWallsLeft}
              />
            )}
            {winner && <EndScreen winner={winner} player={player} />}
            <ToastContainer
              newestOnTop
              closeOnClick
              draggable
              hideProgressBar={false}
              pauseOnFocusLoss={false}
              pauseOnHover={false}
              closeButton={false}
              autoClose={3000}
              limit={3}
              position="bottom-right"
              toastClassName="toast-body"
              progressClassName="toast-progress-bar"
            />
          </div>
        </Await>
      </Suspense>
    </div>
  );
};
