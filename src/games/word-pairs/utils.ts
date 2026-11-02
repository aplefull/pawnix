// UTILS
import { shuffle } from '@utils';
// CONSTANTS
import { PHASES, SEATS, WORDS_PER_ROUND } from './constants';
import { WORDS } from './words';
// TYPES
import type { GameState, Language, Pairing, Seat } from './types';

export const HIDDEN_PAIR = -1;

export const encodePicks = (pairing: Pairing, conceal: boolean) => {
  return pairing.map((value) => (value === null ? '-' : conceal ? '*' : String(value))).join('');
};

export const decodePicks = (picks: string): Pairing => {
  return [...picks].map((char) => (char === '-' ? null : char === '*' ? HIDDEN_PAIR : Number(char)));
};

export const getOtherSeat = (seat: Seat): Seat => {
  return seat === SEATS[0] ? SEATS[1] : SEATS[0];
};

export const getGuesser = (state: GameState) => {
  return getOtherSeat(state.matcher);
};

export const dealWords = (language: Language) => {
  return {
    nouns: shuffle(WORDS[language].nouns).slice(0, WORDS_PER_ROUND),
    adjectives: shuffle(WORDS[language].adjectives).slice(0, WORDS_PER_ROUND),
  };
};

export const createInitialState = (language: Language, totalRounds: number): GameState => {
  return {
    language,
    totalRounds,
    round: 1,
    phase: PHASES.MATCHING,
    matcher: SEATS[0],
    ...dealWords(language),
    guess: null,
    scores: { One: 0, Two: 0 },
  };
};

export const countCorrect = (pairing: number[], guess: number[]) => {
  return pairing.filter((adjective, noun) => guess[noun] === adjective).length;
};

export const getNextRoundState = (state: GameState, pairing: number[]): Partial<GameState> => {
  const guesser = getGuesser(state);
  const scores = { ...state.scores, [guesser]: state.scores[guesser] + countCorrect(pairing, state.guess ?? []) };

  if (state.round >= state.totalRounds) {
    return { phase: PHASES.FINISHED, scores };
  }

  return {
    phase: PHASES.MATCHING,
    round: state.round + 1,
    matcher: guesser,
    ...dealWords(state.language),
    guess: null,
    scores,
  };
};

export const getRematchState = (state: GameState) => {
  return createInitialState(state.language, state.totalRounds);
};
