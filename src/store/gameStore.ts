// LIBRARIES
import { create } from 'zustand';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
// CONSTANTS
import { PLAYERS, PLAYFIELD_SIZE, WALLS_PER_PLAYER } from '@constants';
// SERVICES
import { db } from '@services';
// UTILS
import { getOpponent, logger } from '@utils';
// TYPES
import type { GameState, Player, Position, RoomData } from './types';

type GameStore = GameState & {
  player: Player;
  roomId: string | null;
  enterRoom: (roomId: string, player: Player) => void;
  setData: (data: RoomData) => void;
  createRoom: (roomId: string, player: Player) => Promise<void>;
  restartGame: () => Promise<void>;
  move: (position: Position) => Promise<void>;
  place: (coords: Position[]) => Promise<void>;
};

const INITIAL_GAME_STATE: GameState = {
  placed: [],
  playerOnePos: { row: PLAYFIELD_SIZE, col: 8 },
  playerTwoPos: { row: 0, col: 8 },
  playerOneWallsLeft: WALLS_PER_PLAYER,
  playerTwoWallsLeft: WALLS_PER_PLAYER,
  turn: PLAYERS.PLAYER_1,
  isGameStarted: false,
  winner: null,
};

const getRoomRef = (roomId: string) => doc(db, 'rooms', roomId);

export const useGameStore = create<GameStore>()((set, get) => ({
  ...INITIAL_GAME_STATE,
  player: PLAYERS.PLAYER_1,
  roomId: null,

  enterRoom: (roomId, player) => {
    set({ roomId, player });
  },

  setData: (data) => {
    set({
      placed: data.placed,
      playerOnePos: { row: data.playerOnePos.row, col: data.playerOnePos.col },
      playerTwoPos: { row: data.playerTwoPos.row, col: data.playerTwoPos.col },
      playerOneWallsLeft: data.playerOneWallsLeft,
      playerTwoWallsLeft: data.playerTwoWallsLeft,
      turn: data.turn,
      isGameStarted: data.isGameStarted,
      winner: data.winner,
      roomId: data.roomId,
    });
  },

  createRoom: async (roomId, player) => {
    set({ ...INITIAL_GAME_STATE, roomId, player });

    await setDoc(getRoomRef(roomId), {
      ...INITIAL_GAME_STATE,
      roomId,
      initialPlayer: player,
    } satisfies RoomData);
  },

  restartGame: async () => {
    const { roomId } = get();

    if (!roomId) {
      logger.error('Room id is not provided');
      return;
    }

    const docSnap = await getDoc(getRoomRef(roomId));

    if (!docSnap.exists()) return;

    const { initialPlayer } = docSnap.data() as RoomData;

    if (!initialPlayer) {
      logger.error(`Initial player is ${initialPlayer}`);
      return;
    }

    await setDoc(
      getRoomRef(roomId),
      { ...INITIAL_GAME_STATE, isGameStarted: true, roomId, initialPlayer } satisfies RoomData,
      { merge: true }
    );
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

  place: async (coords) => {
    const { player, roomId, turn, placed, playerOneWallsLeft, playerTwoWallsLeft } = get();

    if (!roomId) {
      logger.error('Room id is not provided');
      return;
    }

    const isPlayerOne = player === PLAYERS.PLAYER_1;

    const update = {
      placed: [...placed, ...coords],
      playerOneWallsLeft: isPlayerOne ? playerOneWallsLeft - 1 : playerOneWallsLeft,
      playerTwoWallsLeft: isPlayerOne ? playerTwoWallsLeft : playerTwoWallsLeft - 1,
      turn: getOpponent(turn),
    };

    await updateDoc(getRoomRef(roomId), update);
    set(update);
  },
}));
