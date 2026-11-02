// LIBRARIES
import { useShallow } from 'zustand/shallow';
// COMPONENTS
import { Button, Gif, Panel, WaitingPanel } from '@components';
import { PlayerBar } from './PlayerBar';
import { Playfield } from './Playfield';
// STORE
import { restartGame, useQuoridor } from '../store';
// UTILS
import { getOpponent, isCurrentPlayerTurn } from '../utils';
// CONSTANTS
import { PLAYERS } from '../constants';
// TYPES
import type { Player } from '../types';
// STYLES
import styles from '@styles/games/quoridor/game.module.scss';

type TEndScreenProps = {
  winner: Player;
  player: Player;
};

const EndScreen = ({ winner, player }: TEndScreenProps) => {
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

export const Game = () => {
  const { winner, turn, player, players, roomId, playerOneWallsLeft, playerTwoWallsLeft } = useQuoridor(
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
    <div className={styles.page}>
      <PlayerBar
        player={opponent}
        isYou={false}
        isActive={!isWaiting && !winner && !isYourTurn}
        wallsLeft={opponentWalls}
      />
      <div className={styles.board}>
        <Playfield />
        {isWaiting && roomId && (
          <div className={styles.overlay}>
            <WaitingPanel roomId={roomId} />
          </div>
        )}
        {winner && <EndScreen winner={winner} player={player} />}
      </div>
      <PlayerBar player={player} isYou isActive={!isWaiting && !winner && isYourTurn} wallsLeft={ownWalls} />
    </div>
  );
};
