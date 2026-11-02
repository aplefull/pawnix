// CONSTANTS
import type { PLAYERS } from '@constants';

export type Position = {
  row: number;
  col: number;
};

export type Player = (typeof PLAYERS)[keyof typeof PLAYERS];

export type WallOrientation = 'horizontal' | 'vertical';

export type Wall = Position & {
  orientation: WallOrientation;
};

export type Players = Record<Player, string | null>;

export type GameState = {
  walls: Wall[];
  playerOnePos: Position;
  playerTwoPos: Position;
  playerOneWallsLeft: number;
  playerTwoWallsLeft: number;
  turn: Player;
  winner: Player | null;
};

export type RoomData = GameState & {
  players: Players;
};
