// TYPES
import type { GameState, Players } from './types';

export const ELEMENTS = {
  TILE: 'tile',
  VERTICAL_WALL: 'vertical_wall',
  HORIZONTAL_WALL: 'horizontal_wall',
  INTERSECTION: 'intersection',
} as const;

export const PLAYERS = {
  PLAYER_1: 'One',
  PLAYER_2: 'Two',
} as const;

export const PLAYER_NAMES = {
  [PLAYERS.PLAYER_1]: 'Ivory',
  [PLAYERS.PLAYER_2]: 'Teal',
} as const;

export const WALLS_PER_PLAYER = 10;

export type TElements = (typeof ELEMENTS)[keyof typeof ELEMENTS];

const FULL_ROW = [
  'tile',
  'vertical_wall',
  'tile',
  'vertical_wall',
  'tile',
  'vertical_wall',
  'tile',
  'vertical_wall',
  'tile',
  'vertical_wall',
  'tile',
  'vertical_wall',
  'tile',
  'vertical_wall',
  'tile',
  'vertical_wall',
  'tile',
] as const;

const SMALL_ROW = [
  'horizontal_wall',
  'intersection',
  'horizontal_wall',
  'intersection',
  'horizontal_wall',
  'intersection',
  'horizontal_wall',
  'intersection',
  'horizontal_wall',
  'intersection',
  'horizontal_wall',
  'intersection',
  'horizontal_wall',
  'intersection',
  'horizontal_wall',
  'intersection',
  'horizontal_wall',
] as const;

export const PLAYFIELD_INITIAL_STATE = [
  [...FULL_ROW],
  [...SMALL_ROW],
  [...FULL_ROW],
  [...SMALL_ROW],
  [...FULL_ROW],
  [...SMALL_ROW],
  [...FULL_ROW],
  [...SMALL_ROW],
  [...FULL_ROW],
  [...SMALL_ROW],
  [...FULL_ROW],
  [...SMALL_ROW],
  [...FULL_ROW],
  [...SMALL_ROW],
  [...FULL_ROW],
  [...SMALL_ROW],
  [...FULL_ROW],
];

export const PLAYFIELD_SIZE = PLAYFIELD_INITIAL_STATE.length - 1;

export const GAME_ID = 'quoridor';

export const SEATS = [PLAYERS.PLAYER_1, PLAYERS.PLAYER_2] as const;

export const EMPTY_SEATS: Players = { [PLAYERS.PLAYER_1]: null, [PLAYERS.PLAYER_2]: null };

export const INITIAL_GAME_STATE: GameState = {
  walls: [],
  playerOnePos: { row: PLAYFIELD_SIZE, col: 8 },
  playerTwoPos: { row: 0, col: 8 },
  playerOneWallsLeft: WALLS_PER_PLAYER,
  playerTwoWallsLeft: WALLS_PER_PLAYER,
  turn: PLAYERS.PLAYER_1,
  winner: null,
};
