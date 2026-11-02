// CONSTANTS
import type { LANGUAGES, PHASES, SEATS } from './constants';

export type Seat = (typeof SEATS)[number];

export type Language = keyof typeof LANGUAGES;

export type Phase = (typeof PHASES)[keyof typeof PHASES];

export type Scores = Record<Seat, number>;

export type GameState = {
  language: Language;
  totalRounds: number;
  round: number;
  phase: Phase;
  matcher: Seat;
  nouns: string[];
  adjectives: string[];
  guess: number[] | null;
  scores: Scores;
};

export type Secret = {
  round: number;
  pairing: number[];
};
