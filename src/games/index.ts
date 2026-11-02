// GAMES
import { QUORIDOR } from './quoridor/meta';
import { WORD_PAIRS } from './word-pairs/meta';
// TYPES
import type { GameEntry } from './types';

export * from './types';

export const GAMES: GameEntry[] = [
  { ...QUORIDOR, load: () => import('./quoridor') },
  { ...WORD_PAIRS, load: () => import('./word-pairs') },
];

export const getGame = (id: string) => {
  return GAMES.find((game) => game.id === id) ?? null;
};
