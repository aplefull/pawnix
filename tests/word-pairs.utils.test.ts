import { describe, expect, it } from 'vitest';
import {
  countCorrect,
  createInitialState,
  dealWords,
  decodePicks,
  encodePicks,
  getNextRoundState,
  getRematchState,
  getScoredState,
} from '../src/games/word-pairs/utils';
import { WORDS } from '../src/games/word-pairs/words';

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

  it('adds the correct pairs to the guesser and marks the round scored', () => {
    const state = { ...createInitialState('en', 4), phase: 'reveal' as const, guess: [2, 0, 4, 3, 1] };

    expect(getScoredState(state, [2, 0, 4, 1, 3])).toEqual({ scores: { One: 0, Two: 3 }, scored: true });
  });

  it('swaps roles and deals new words for the next round without touching scores', () => {
    const state = {
      ...createInitialState('en', 4),
      phase: 'reveal' as const,
      guess: [2, 0, 4, 3, 1],
      scores: { One: 0, Two: 3 },
      scored: true,
    };
    const next = getNextRoundState(state);

    expect(next).toMatchObject({ phase: 'matching', round: 2, matcher: 'Two', guess: null, scored: false });
    expect(next.scores).toBeUndefined();
    expect(next.nouns).toHaveLength(5);
  });

  it('finishes after the last round without dealing again', () => {
    const state = {
      ...createInitialState('ru', 2),
      round: 2,
      matcher: 'Two' as const,
      phase: 'reveal' as const,
      guess: [0, 1, 2, 3, 4],
      scores: { One: 5, Two: 4 },
      scored: true,
    };

    expect(getNextRoundState(state)).toEqual({ phase: 'finished' });
  });

  it('encodes live picks and hides the matcher pairs', () => {
    expect(encodePicks([2, 0, null, 4, null], false)).toBe('20-4-');
    expect(encodePicks([2, 0, null, 4, null], true)).toBe('**-*-');
    expect(decodePicks('20-4-')).toEqual([2, 0, null, 4, null]);
    expect(decodePicks('**-*-')).toEqual([-1, -1, null, -1, null]);
  });

  it('keeps the settings for a rematch', () => {
    const rematch = getRematchState({ ...createInitialState('ru', 6), round: 6, phase: 'finished' });

    expect(rematch).toMatchObject({ language: 'ru', totalRounds: 6, round: 1, phase: 'matching', matcher: 'One' });
  });
});
