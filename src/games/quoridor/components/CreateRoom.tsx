// GAMES
import type { TCreateRoomProps } from '@games';
// COMPONENTS
import { Pawn } from './Pawn';
// CONSTANTS
import { INITIAL_GAME_STATE, PLAYER_NAMES, PLAYERS } from '../constants';
// TYPES
import type { Player } from '../types';
// STYLES
import styles from '@styles/games/quoridor/create-room.module.scss';

export const CreateRoom = ({ onCreate }: TCreateRoomProps) => {
  const handlePlayerSelect = (seat: Player) => () => {
    onCreate({ seat, state: INITIAL_GAME_STATE });
  };

  return (
    <>
      <p className={styles.hint}>Pick your pawn</p>
      <div className={styles.pawnChoice}>
        {[PLAYERS.PLAYER_1, PLAYERS.PLAYER_2].map((value) => (
          <button key={value} type="button" className={styles.pawnOption} onClick={handlePlayerSelect(value)}>
            <Pawn player={value} className={styles.pawnPreview} />
            <span className={styles.pawnName}>{PLAYER_NAMES[value]}</span>
            <span className={styles.pawnOrder}>{value === PLAYERS.PLAYER_1 ? 'Moves first' : 'Moves second'}</span>
          </button>
        ))}
      </div>
    </>
  );
};
