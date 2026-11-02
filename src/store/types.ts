// CONSTANTS
import type { PLAYERS } from '@constants';

export type Position = {
  row: number;
  col: number;
};

export type Player = (typeof PLAYERS)[keyof typeof PLAYERS];

export type GameState = {
  placed: Position[];
  playerOnePos: Position;
  playerTwoPos: Position;
  playerOneWallsLeft: number;
  playerTwoWallsLeft: number;
  turn: Player;
  isGameStarted: boolean;
  winner: Player | null;
};

export type RoomData = GameState & {
  roomId: string;
  initialPlayer: Player;
};
