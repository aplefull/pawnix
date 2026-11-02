import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const ROOM_ID = 'WRDPRS';
const DAY_MS = 24 * 60 * 60 * 1000;

const NOUNS = ['Hamster', 'Pancake', 'Walrus', 'Teapot', 'Cactus'];
const ADJECTIVES = ['Fluffy', 'Sneaky', 'Purple', 'Bouncy', 'Grumpy'];
const PAIRING = [2, 0, 4, 1, 3];

const INITIAL_STATE = {
  language: 'en',
  totalRounds: 4,
  round: 1,
  phase: 'matching',
  matcher: 'One',
  nouns: NOUNS,
  adjectives: ADJECTIVES,
  guess: null,
  scores: { One: 0, Two: 0 },
  scored: false,
};

let env: RulesTestEnvironment;

const db = (uid: string) => env.authenticatedContext(uid).firestore();
const room = (uid: string) => doc(db(uid), 'rooms', ROOM_ID);
const secret = (uid: string, seat: string) => doc(db(uid), 'rooms', ROOM_ID, 'private', seat);

const seed = (state: Record<string, unknown> = {}, secrets: Record<string, Record<string, unknown>> = {}) =>
  env.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();

    await setDoc(doc(firestore, 'rooms', ROOM_ID), {
      game: 'word-pairs',
      players: { One: 'alice', Two: 'bob' },
      names: { One: 'Alice', Two: 'Bob' },
      state: { ...INITIAL_STATE, ...state },
      createdAt: new Date(),
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * DAY_MS),
    });

    for (const [seat, data] of Object.entries(secrets)) {
      await setDoc(doc(firestore, 'rooms', ROOM_ID, 'private', seat), data);
    }
  });

const play = (uid: string, patch: Record<string, unknown>) =>
  updateDoc(room(uid), Object.fromEntries(Object.entries(patch).map(([key, value]) => [`state.${key}`, value])));

const submitPairing = (uid: string, seat: string, pairing: unknown, round = 1) => {
  const firestore = db(uid);
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'rooms', ROOM_ID, 'private', seat), { round, pairing });
  batch.update(doc(firestore, 'rooms', ROOM_ID), { 'state.phase': 'guessing' });
  return batch.commit();
};

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-pawnix',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('creating a room', () => {
  const newRoom = (state: Record<string, unknown> = {}) => ({
    game: 'word-pairs',
    players: { One: 'alice', Two: null },
    names: { One: 'Alice', Two: null },
    state: { ...INITIAL_STATE, ...state },
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + 7 * DAY_MS),
  });

  it('accepts a fresh game in either language', async () => {
    await assertSucceeds(setDoc(room('alice'), newRoom()));
    await env.clearFirestore();
    await assertSucceeds(setDoc(room('alice'), newRoom({ language: 'ru', totalRounds: 10 })));
  });

  it('rejects unknown languages and odd or out-of-range round counts', async () => {
    await assertFails(setDoc(room('alice'), newRoom({ language: 'de' })));
    await assertFails(setDoc(room('alice'), newRoom({ totalRounds: 3 })));
    await assertFails(setDoc(room('alice'), newRoom({ totalRounds: 12 })));
  });

  it('rejects games that do not start at round one with empty scores', async () => {
    await assertFails(setDoc(room('alice'), newRoom({ round: 2 })));
    await assertFails(setDoc(room('alice'), newRoom({ phase: 'guessing' })));
    await assertFails(setDoc(room('alice'), newRoom({ matcher: 'Two' })));
    await assertFails(setDoc(room('alice'), newRoom({ scores: { One: 5, Two: 0 } })));
    await assertFails(setDoc(room('alice'), newRoom({ guess: PAIRING })));
    await assertFails(setDoc(room('alice'), newRoom({ extra: true })));
  });

  it('requires five different nouns and adjectives', async () => {
    await assertFails(setDoc(room('alice'), newRoom({ nouns: NOUNS.slice(0, 4) })));
    await assertFails(setDoc(room('alice'), newRoom({ adjectives: [...ADJECTIVES.slice(0, 4), 'Fluffy'] })));
  });
});

describe('matching', () => {
  it('lets the matcher store a pairing and move to guessing', async () => {
    await seed();
    await assertSucceeds(submitPairing('alice', 'One', PAIRING));
  });

  it('does not let the guesser submit a pairing', async () => {
    await seed();
    await assertFails(submitPairing('bob', 'Two', PAIRING));
    await assertFails(submitPairing('bob', 'One', PAIRING));
  });

  it('requires the pairing to exist for the current round', async () => {
    await seed();
    await assertFails(play('alice', { phase: 'guessing' }));
    await assertFails(submitPairing('alice', 'One', PAIRING, 2));
  });

  it('rejects pairings that are not a permutation of five adjectives', async () => {
    await seed();
    await assertFails(submitPairing('alice', 'One', [0, 0, 1, 2, 3]));
    await assertFails(submitPairing('alice', 'One', [0, 1, 2, 3]));
    await assertFails(submitPairing('alice', 'One', [0, 1, 2, 3, 5]));
  });

  it('does not allow matching before the second player joins', async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'rooms', ROOM_ID), { 'players.Two': null, 'names.Two': null });
    });
    await assertFails(setDoc(secret('alice', 'One'), { round: 1, pairing: PAIRING }));
  });

  it('does not allow changing the pairing after the guessing starts', async () => {
    await seed({ phase: 'guessing' }, { One: { round: 1, pairing: PAIRING } });
    await assertFails(setDoc(secret('alice', 'One'), { round: 1, pairing: [0, 1, 2, 3, 4] }));
  });
});

describe('reading the pairing', () => {
  it('lets the owner read it at any time', async () => {
    await seed({ phase: 'guessing' }, { One: { round: 1, pairing: PAIRING } });
    await assertSucceeds(getDoc(secret('alice', 'One')));
  });

  it('hides it from the guesser until the reveal', async () => {
    await seed({ phase: 'guessing' }, { One: { round: 1, pairing: PAIRING } });
    await assertFails(getDoc(secret('bob', 'One')));
  });

  it('shows it to the guesser during the reveal and after the game', async () => {
    await seed({ phase: 'reveal', guess: PAIRING }, { One: { round: 1, pairing: PAIRING } });
    await assertSucceeds(getDoc(secret('bob', 'One')));

    await seed({ round: 4, phase: 'finished', matcher: 'Two' }, { Two: { round: 4, pairing: PAIRING } });
    await assertSucceeds(getDoc(secret('alice', 'Two')));
  });

  it('hides a new pairing that reuses the same document', async () => {
    await seed({ round: 3, phase: 'guessing' }, { One: { round: 3, pairing: PAIRING } });
    await assertFails(getDoc(secret('bob', 'One')));
  });

  it('never shows it to outsiders', async () => {
    await seed({ phase: 'reveal', guess: PAIRING }, { One: { round: 1, pairing: PAIRING } });
    await assertFails(getDoc(secret('carol', 'One')));
  });
});

describe('guessing', () => {
  beforeEach(async () => {
    await seed({ phase: 'guessing' }, { One: { round: 1, pairing: PAIRING } });
  });

  it('lets the guesser submit a guess and reveal', async () => {
    await assertSucceeds(play('bob', { phase: 'reveal', guess: [0, 1, 2, 3, 4] }));
  });

  it('does not let the matcher guess', async () => {
    await assertFails(play('alice', { phase: 'reveal', guess: PAIRING }));
  });

  it('rejects malformed guesses and extra changes', async () => {
    await assertFails(play('bob', { phase: 'reveal', guess: [0, 0, 0, 0, 0] }));
    await assertFails(play('bob', { phase: 'reveal' }));
    await assertFails(play('bob', { phase: 'reveal', guess: PAIRING, scores: { One: 0, Two: 5 } }));
  });
});

describe('scoring', () => {
  const revealed = { phase: 'reveal', guess: [2, 0, 4, 3, 1] };

  beforeEach(async () => {
    await seed(revealed, { One: { round: 1, pairing: PAIRING } });
  });

  it('lets either player score the revealed round once', async () => {
    await assertSucceeds(play('bob', { scores: { One: 0, Two: 3 }, scored: true }));
    await assertFails(play('alice', { scores: { One: 0, Two: 6 }, scored: true }));

    await seed(revealed);
    await assertSucceeds(play('alice', { scores: { One: 0, Two: 3 }, scored: true }));
  });

  it('only lets the guesser gain zero to five points', async () => {
    await assertFails(play('alice', { scores: { One: 1, Two: 3 }, scored: true }));
    await assertFails(play('alice', { scores: { One: 0, Two: 6 }, scored: true }));
    await assertFails(play('alice', { scores: { One: 0, Two: -1 }, scored: true }));
    await assertSucceeds(play('alice', { scores: { One: 0, Two: 0 }, scored: true }));
  });

  it('requires marking the round scored and nothing else', async () => {
    await assertFails(play('alice', { scores: { One: 0, Two: 3 } }));
    await assertFails(play('alice', { scores: { One: 0, Two: 3 }, scored: true, guess: PAIRING }));
  });

  it('does not allow scoring before the reveal or by outsiders', async () => {
    await assertFails(play('carol', { scores: { One: 0, Two: 3 }, scored: true }));

    await seed({ phase: 'guessing' }, { One: { round: 1, pairing: PAIRING } });
    await assertFails(play('alice', { scores: { One: 0, Two: 3 }, scored: true }));
  });
});

describe('next round', () => {
  const nextRound = {
    phase: 'matching',
    round: 2,
    matcher: 'Two',
    nouns: ['Penguin', 'Noodle', 'Sock', 'Raven', 'Pickle'],
    adjectives: ['Sleepy', 'Sticky', 'Wobbly', 'Murky', 'Jolly'],
    guess: null,
    scored: false,
  };

  const scoredReveal = { phase: 'reveal', guess: [2, 0, 4, 3, 1], scores: { One: 0, Two: 3 }, scored: true };

  beforeEach(async () => {
    await seed(scoredReveal, { One: { round: 1, pairing: PAIRING } });
  });

  it('lets either player start the next round with swapped roles', async () => {
    await assertSucceeds(play('alice', nextRound));
    await seed(scoredReveal);
    await assertSucceeds(play('bob', nextRound));
  });

  it('waits until the round is scored', async () => {
    await seed({ ...scoredReveal, scores: { One: 0, Two: 0 }, scored: false });
    await assertFails(play('alice', nextRound));
  });

  it('does not touch scores', async () => {
    await assertFails(play('alice', { ...nextRound, scores: { One: 0, Two: 8 } }));
  });

  it('requires swapped roles, a new round number, a clean guess and an unscored round', async () => {
    await assertFails(play('alice', { ...nextRound, matcher: 'One' }));
    await assertFails(play('alice', { ...nextRound, round: 3 }));
    await assertFails(play('alice', { ...nextRound, guess: PAIRING }));
    await assertFails(play('alice', { ...nextRound, nouns: NOUNS.slice(0, 3) }));
    await assertFails(play('alice', { ...nextRound, scored: true }));
  });

  it('does not let outsiders advance the game', async () => {
    await assertFails(play('carol', nextRound));
  });

  it('finishes instead of starting a new round after the last one', async () => {
    await seed({
      round: 4,
      matcher: 'Two',
      phase: 'reveal',
      guess: PAIRING,
      scores: { One: 11, Two: 4 },
      scored: true,
    });
    await assertFails(play('alice', { ...nextRound, round: 5, matcher: 'One' }));
    await assertFails(play('alice', { phase: 'finished', scores: { One: 12, Two: 4 } }));
    await assertSucceeds(play('alice', { phase: 'finished' }));
  });

  it('does not finish early or before scoring', async () => {
    await assertFails(play('alice', { phase: 'finished' }));

    await seed({ round: 4, matcher: 'Two', phase: 'reveal', guess: PAIRING, scores: { One: 6, Two: 4 } });
    await assertFails(play('alice', { phase: 'finished' }));
  });
});

describe('rematch', () => {
  it('lets either player restart a finished game with the same settings', async () => {
    await seed({
      round: 4,
      matcher: 'Two',
      phase: 'finished',
      guess: PAIRING,
      scores: { One: 11, Two: 4 },
      scored: true,
    });
    await assertSucceeds(updateDoc(room('bob'), { state: INITIAL_STATE }));
  });

  it('does not allow restarting mid-game or changing settings', async () => {
    await seed({ phase: 'reveal', guess: PAIRING });
    await assertFails(updateDoc(room('alice'), { state: INITIAL_STATE }));

    await seed({
      round: 4,
      matcher: 'Two',
      phase: 'finished',
      guess: PAIRING,
      scores: { One: 11, Two: 4 },
      scored: true,
    });
    await assertFails(updateDoc(room('alice'), { state: { ...INITIAL_STATE, language: 'ru' } }));
    await assertFails(updateDoc(room('alice'), { state: { ...INITIAL_STATE, totalRounds: 2 } }));
  });
});
