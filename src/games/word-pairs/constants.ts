export const SEATS = ['One', 'Two'] as const;

export const LANGUAGES = {
  ru: 'Русский',
  en: 'English',
} as const;

export const PHASES = {
  MATCHING: 'matching',
  GUESSING: 'guessing',
  REVEAL: 'reveal',
  FINISHED: 'finished',
} as const;

export const ROUND_OPTIONS = [2, 4, 6, 8, 10] as const;

export const DEFAULT_ROUNDS = 4;

export const WORDS_PER_ROUND = 5;
