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
  scored: boolean;
};

export type Secret = {
  round: number;
  pairing: number[];
};

export type Pairing = (number | null)[];

export type Live = {
  round: number;
  phase: Phase;
  picks: string;
};
