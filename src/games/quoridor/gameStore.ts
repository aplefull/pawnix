// LIBRARIES
import { create } from 'zustand';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
// CONSTANTS
import { PLAYERS, PLAYFIELD_SIZE, WALLS_PER_PLAYER } from './constants';
// SERVICES
import { db, ensureSignedIn } from '@services';
// UTILS
import { logger } from '@utils';
import { getOpponent } from './utils';
// TYPES
import type { GameState, Player, Players, Position, RoomData, Wall } from './types';

type GameStore = GameState & {
  player: Player;
  players: Players;
  roomId: string | null;
  enterRoom: (roomId: string, player: Player) => void;
  setData: (data: RoomData) => void;
  createRoom: (roomId: string, player: Player) => Promise<void>;
  restartGame: () => Promise<void>;
  move: (position: Position) => Promise<void>;
  place: (wall: Wall) => Promise<void>;
};

const INITIAL_GAME_STATE: GameState = {
  walls: [],
  playerOnePos: { row: PLAYFIELD_SIZE, col: 8 },
  playerTwoPos: { row: 0, col: 8 },
  playerOneWallsLeft: WALLS_PER_PLAYER,
  playerTwoWallsLeft: WALLS_PER_PLAYER,
  turn: PLAYERS.PLAYER_1,
  winner: null,
};

const EMPTY_SEATS: Players = { [PLAYERS.PLAYER_1]: null, [PLAYERS.PLAYER_2]: null };

const getRoomRef = (roomId: string) => doc(db, 'rooms', roomId);

export const useGameStore = create<GameStore>()((set, get) => ({
  ...INITIAL_GAME_STATE,
  player: PLAYERS.PLAYER_1,
  players: EMPTY_SEATS,
  roomId: null,

  enterRoom: (roomId, player) => {
    set({ roomId, player });
  },

  setData: (data) => {
    set({
      walls: data.walls,
      playerOnePos: { row: data.playerOnePos.row, col: data.playerOnePos.col },
      playerTwoPos: { row: data.playerTwoPos.row, col: data.playerTwoPos.col },
      playerOneWallsLeft: data.playerOneWallsLeft,
      playerTwoWallsLeft: data.playerTwoWallsLeft,
      turn: data.turn,
      winner: data.winner,
      players: data.players,
    });
  },

  createRoom: async (roomId, player) => {
    const user = await ensureSignedIn();
    const players = { ...EMPTY_SEATS, [player]: user.uid };

    set({ ...INITIAL_GAME_STATE, roomId, player, players });

    await setDoc(getRoomRef(roomId), { ...INITIAL_GAME_STATE, players, createdAt: serverTimestamp() });
  },

  restartGame: async () => {
    const { roomId } = get();

    if (!roomId) {
      logger.error('Room id is not provided');
      return;
    }

    await setDoc(getRoomRef(roomId), INITIAL_GAME_STATE, { merge: true });
  },

  move: async (position) => {
    const { player, roomId, turn, winner, playerOnePos, playerTwoPos } = get();

    if (!roomId) {
      logger.error('Room id is not provided');
      return;
    }

    const isPlayerOne = player === PLAYERS.PLAYER_1;
    const isWinningMove = isPlayerOne ? position.row === 0 : position.row === PLAYFIELD_SIZE;

    const update = {
      playerOnePos: isPlayerOne ? position : playerOnePos,
      playerTwoPos: isPlayerOne ? playerTwoPos : position,
      turn: getOpponent(turn),
      winner: isWinningMove ? player : winner,
    };

    await updateDoc(getRoomRef(roomId), update);
    set(update);
  },

  place: async (wall) => {
    const { player, roomId, turn, walls, playerOneWallsLeft, playerTwoWallsLeft } = get();

    if (!roomId) {
      logger.error('Room id is not provided');
      return;
    }

    const isPlayerOne = player === PLAYERS.PLAYER_1;

    const update = {
      walls: [...walls, wall],
      playerOneWallsLeft: isPlayerOne ? playerOneWallsLeft - 1 : playerOneWallsLeft,
      playerTwoWallsLeft: isPlayerOne ? playerTwoWallsLeft : playerTwoWallsLeft - 1,
      turn: getOpponent(turn),
    };

    await updateDoc(getRoomRef(roomId), update);
    set(update);
  },
}));
