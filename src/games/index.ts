// GAMES
import { QUORIDOR } from './quoridor/meta';
// TYPES
import type { GameEntry } from './types';

export * from './types';

export const GAMES: GameEntry[] = [{ ...QUORIDOR, load: () => import('./quoridor') }];

export const getGame = (id: string) => {
  return GAMES.find((game) => game.id === id) ?? null;
};
