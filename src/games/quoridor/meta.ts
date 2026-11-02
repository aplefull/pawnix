// GAMES
import type { GameMeta } from '@games';
// CONSTANTS
import { PLAYERS } from './constants';

export const QUORIDOR: GameMeta = {
  id: 'quoridor',
  name: 'Quoridor',
  tagline: 'Reach the far side first. Use walls to slow your opponent down.',
  seats: [PLAYERS.PLAYER_1, PLAYERS.PLAYER_2],
};
