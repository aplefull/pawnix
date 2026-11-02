// LIBRARIES
import { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router';
import { useShallow } from 'zustand/shallow';
// GAMES
import {
  getOpponent,
  isCurrentPlayerTurn,
  type Player,
  PlayerBar,
  PLAYERS,
  Playfield,
  useGameStore,
} from '@games/quoridor';
// UTILS
import { logger } from '@utils';
// COMPONENTS
import { Button, Gif, Panel, RoomCode, Spinner } from '@components';
// STYLES
import styles from '@styles/pages/play-page.module.scss';

type TEndScreenProps = {
  winner: Player;
  player: Player;
};

const EndScreen = ({ winner, player }: TEndScreenProps) => {
  const restartGame = useGameStore((state) => state.restartGame);
  const isWinner = winner === player;

  const handleRestart = () => {
    restartGame();
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

const WaitingScreen = ({ roomId }: { roomId: string }) => {
  return (
    <div className={styles.overlay}>
      <Panel className={styles.endScreen}>
        <div className={styles.waiting}>
          <Spinner size="sm" />
          <span>Waiting for your opponent to join...</span>
        </div>
        <p className={styles.resultText}>Send them this room code:</p>
        <RoomCode code={roomId} />
      </Panel>
    </div>
  );
};

const Game = () => {
  const { winner, turn, player, players, roomId, playerOneWallsLeft, playerTwoWallsLeft } = useGameStore(
    useShallow((state) => ({
      winner: state.winner,
      turn: state.turn,
      player: state.player,
      players: state.players,
      roomId: state.roomId,
      playerOneWallsLeft: state.playerOneWallsLeft,
      playerTwoWallsLeft: state.playerTwoWallsLeft,
    }))
  );

  const isWaiting = !players.One || !players.Two;

  const opponent = getOpponent(player);
  const ownWalls = player === PLAYERS.PLAYER_1 ? playerOneWallsLeft : playerTwoWallsLeft;
  const opponentWalls = player === PLAYERS.PLAYER_1 ? playerTwoWallsLeft : playerOneWallsLeft;
  const isYourTurn = isCurrentPlayerTurn(turn, player);

  return (
    <>
      <PlayerBar
        player={opponent}
        isYou={false}
        isActive={!isWaiting && !winner && !isYourTurn}
        wallsLeft={opponentWalls}
      />
      <div className={styles.board}>
        <Playfield />
        {isWaiting && roomId && <WaitingScreen roomId={roomId} />}
        {winner && <EndScreen winner={winner} player={player} />}
      </div>
      <PlayerBar player={player} isYou isActive={!isWaiting && !winner && isYourTurn} wallsLeft={ownWalls} />
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
