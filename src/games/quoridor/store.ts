// STORE
import { type RoomStore, useRoomStore } from '@store';
// SERVICES
import { resetRoomState, updateRoomState } from '@services';
// UTILS
import { logger } from '@utils';
import { getOpponent } from './utils';
// CONSTANTS
import { EMPTY_SEATS, INITIAL_GAME_STATE, PLAYERS, PLAYFIELD_SIZE } from './constants';
// TYPES
import type { GameState, Player, Players, Position, Wall } from './types';

type QuoridorView = GameState & {
  roomId: string | null;
  player: Player;
  players: Players;
};

const toView = ({ roomId, seat, room }: RoomStore): QuoridorView => ({
  ...((room?.state as GameState | undefined) ?? INITIAL_GAME_STATE),
  roomId,
  player: (seat as Player | null) ?? PLAYERS.PLAYER_1,
  players: (room?.players as Players | undefined) ?? EMPTY_SEATS,
});

const getView = () => toView(useRoomStore.getState());

export const useQuoridor = <T>(selector: (view: QuoridorView) => T) => {
  return useRoomStore((store) => selector(toView(store)));
};

export const movePawn = async (position: Position) => {
  const { player, roomId, turn, winner, playerOnePos, playerTwoPos } = getView();

  if (!roomId) {
    logger.error('Room id is not provided');
    return;
  }

  const isPlayerOne = player === PLAYERS.PLAYER_1;
  const isWinningMove = isPlayerOne ? position.row === 0 : position.row === PLAYFIELD_SIZE;

  await updateRoomState<GameState>(roomId, {
    playerOnePos: isPlayerOne ? position : playerOnePos,
    playerTwoPos: isPlayerOne ? playerTwoPos : position,
    turn: getOpponent(turn),
    winner: isWinningMove ? player : winner,
  });
};

export const placeWall = async (wall: Wall) => {
  const { player, roomId, turn, walls, playerOneWallsLeft, playerTwoWallsLeft } = getView();

  if (!roomId) {
    logger.error('Room id is not provided');
    return;
  }

  const isPlayerOne = player === PLAYERS.PLAYER_1;

  await updateRoomState<GameState>(roomId, {
    walls: [...walls, wall],
    playerOneWallsLeft: isPlayerOne ? playerOneWallsLeft - 1 : playerOneWallsLeft,
    playerTwoWallsLeft: isPlayerOne ? playerTwoWallsLeft : playerTwoWallsLeft - 1,
    turn: getOpponent(turn),
  });
};

export const restartGame = async () => {
  const { roomId } = getView();

  if (!roomId) {
    logger.error('Room id is not provided');
    return;
  }

  await resetRoomState(roomId, INITIAL_GAME_STATE);
};
