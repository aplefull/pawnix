// LIBRARIES
import { useNavigate } from 'react-router';
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
  const navigate = useNavigate();

  const isWinner = winner === player;

  const handleRestart = () => {
    restartGame();
  };

  const handleHome = () => {
    navigate('/');
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
        <Button variant="secondary" size="lg" fullWidth onClick={handleHome}>
          Home
        </Button>
      </Panel>
    </div>
  );
};

export const Game = () => {
  const { winner, turn, player, players, names, roomId, playerOneWallsLeft, playerTwoWallsLeft } = useQuoridor(
    useShallow((state) => ({
      winner: state.winner,
      turn: state.turn,
      player: state.player,
      players: state.players,
      names: state.names,
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
        uid={players[opponent]}
        name={names[opponent]}
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
      <PlayerBar
        player={player}
        uid={players[player]}
        name={names[player]}
        isYou
        isActive={!isWaiting && !winner && isYourTurn}
        wallsLeft={ownWalls}
      />
    </div>
  );
};
