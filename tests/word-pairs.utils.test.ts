import { describe, expect, it } from 'vitest';
import {
  countCorrect,
  createInitialState,
  dealWords,
  getNextRoundState,
  getRematchState,
  WORDS,
} from '../src/games/word-pairs';

describe('word pairs logic', () => {
  it('deals five different words from the chosen list', () => {
    for (const language of ['ru', 'en'] as const) {
      const { nouns, adjectives } = dealWords(language);

      expect(new Set(nouns).size).toBe(5);
      expect(new Set(adjectives).size).toBe(5);
      expect(nouns.every((noun) => WORDS[language].nouns.includes(noun))).toBe(true);
      expect(adjectives.every((adjective) => WORDS[language].adjectives.includes(adjective))).toBe(true);
    }
  });

  it('has 50 unique words in every list', () => {
    for (const list of Object.values(WORDS).flatMap(({ nouns, adjectives }) => [nouns, adjectives])) {
      expect(new Set(list).size).toBe(50);
    }
  });

  it('counts pairs the guesser got right', () => {
    expect(countCorrect([2, 0, 4, 1, 3], [2, 0, 4, 1, 3])).toBe(5);
    expect(countCorrect([2, 0, 4, 1, 3], [2, 0, 4, 3, 1])).toBe(3);
    expect(countCorrect([2, 0, 4, 1, 3], [0, 1, 2, 3, 4])).toBe(0);
  });

  it('scores the guesser, swaps roles and deals new words for the next round', () => {
    const state = { ...createInitialState('en', 4), phase: 'reveal' as const, guess: [2, 0, 4, 3, 1] };
    const next = getNextRoundState(state, [2, 0, 4, 1, 3]);

    expect(next).toMatchObject({ phase: 'matching', round: 2, matcher: 'Two', guess: null });
    expect(next.scores).toEqual({ One: 0, Two: 3 });
    expect(next.nouns).toHaveLength(5);
  });

  it('finishes after the last round without dealing again', () => {
    const state = {
      ...createInitialState('ru', 2),
      round: 2,
      matcher: 'Two' as const,
      phase: 'reveal' as const,
      guess: [0, 1, 2, 3, 4],
      scores: { One: 0, Two: 4 },
    };

    expect(getNextRoundState(state, [0, 1, 2, 3, 4])).toEqual({ phase: 'finished', scores: { One: 5, Two: 4 } });
  });

  it('keeps the settings for a rematch', () => {
    const rematch = getRematchState({ ...createInitialState('ru', 6), round: 6, phase: 'finished' });

    expect(rematch).toMatchObject({ language: 'ru', totalRounds: 6, round: 1, phase: 'matching', matcher: 'One' });
  });
});
