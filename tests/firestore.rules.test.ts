import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const ROOM_ID = 'ABCDEF';
const DAY_MS = 24 * 60 * 60 * 1000;

const INITIAL_GAME = {
  playerOnePos: { row: 16, col: 8 },
  playerTwoPos: { row: 0, col: 8 },
  playerOneWallsLeft: 10,
  playerTwoWallsLeft: 10,
  walls: [],
  turn: 'One',
  winner: null,
};

let env: RulesTestEnvironment;

const db = (uid: string) => env.authenticatedContext(uid).firestore();
const room = (uid: string, roomId = ROOM_ID) => doc(db(uid), 'rooms', roomId);
const expiresIn = (days: number) => Timestamp.fromMillis(Date.now() + days * DAY_MS);

const seed = (players: Record<string, string | null>, state: Record<string, unknown> = {}) =>
  env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'rooms', ROOM_ID), {
      game: 'quoridor',
      players,
      state: { ...INITIAL_GAME, ...state },
      createdAt: new Date(),
      expiresAt: expiresIn(7),
    });
  });

const seedGame = (state: Record<string, unknown> = {}) => seed({ One: 'alice', Two: 'bob' }, state);

const play = (uid: string, patch: Record<string, unknown>) =>
  updateDoc(room(uid), Object.fromEntries(Object.entries(patch).map(([key, value]) => [`state.${key}`, value])));

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-quoridor',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('reading', () => {
  it('lets signed in users read a room', async () => {
    await seedGame();
    await assertSucceeds(getDoc(room('carol')));
  });

  it('lets signed in users check a code that is not taken', async () => {
    await assertSucceeds(getDoc(room('carol', 'ZZZZZZ')));
  });

  it('blocks anonymous reads and listing rooms', async () => {
    await seedGame();
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'rooms', ROOM_ID)));
    await assertFails(getDocs(collection(db('carol'), 'rooms')));
  });
});

describe('creating a room', () => {
  const newRoom = (players: Record<string, string | null>, overrides: Record<string, unknown> = {}) => ({
    game: 'quoridor',
    players,
    state: INITIAL_GAME,
    createdAt: serverTimestamp(),
    expiresAt: expiresIn(7),
    ...overrides,
  });

  it('lets a user create a room in either seat', async () => {
    await assertSucceeds(setDoc(room('alice'), newRoom({ One: 'alice', Two: null })));
    await env.clearFirestore();
    await assertSucceeds(setDoc(room('alice'), newRoom({ One: null, Two: 'alice' })));
  });

  it('rejects rooms with someone else seated', async () => {
    await assertFails(setDoc(room('alice'), newRoom({ One: 'bob', Two: null })));
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice', Two: 'bob' })));
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice', Two: 'alice' })));
  });

  it('rejects codes outside the room code format', async () => {
    const players = { One: 'alice', Two: null };

    for (const roomId of ['abcdef', 'ABCDE', 'ABCDEFG', 'ABCDE0', 'ABCDEI', 'room-1']) {
      await assertFails(setDoc(room('alice', roomId), newRoom(players)));
    }
  });

  it('rejects unknown games and wrong seats', async () => {
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice', Two: null }, { game: 'chess' })));
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice', Three: null })));
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice', Two: null, Three: null })));
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice' })));
  });

  it('rejects rooms that do not start from the initial position', async () => {
    const players = { One: 'alice', Two: null };

    await assertFails(setDoc(room('alice'), newRoom(players, { state: { ...INITIAL_GAME, playerOneWallsLeft: 20 } })));
    await assertFails(setDoc(room('alice'), newRoom(players, { state: { ...INITIAL_GAME, turn: 'Two' } })));
    await assertFails(setDoc(room('alice'), newRoom(players, { state: { ...INITIAL_GAME, extra: true } })));
    await assertFails(setDoc(room('alice'), newRoom(players, { extra: true })));
  });

  it('requires server creation time and an expiry within a week', async () => {
    const players = { One: 'alice', Two: null };

    await assertFails(setDoc(room('alice'), newRoom(players, { createdAt: new Date() })));
    await assertFails(setDoc(room('alice'), newRoom(players, { expiresAt: expiresIn(30) })));
    await assertFails(setDoc(room('alice'), newRoom(players, { expiresAt: expiresIn(-1) })));
    await assertFails(setDoc(room('alice'), newRoom(players, { expiresAt: null })));
  });

  it('does not let anyone overwrite an existing room', async () => {
    await seedGame();
    await assertFails(setDoc(room('carol'), newRoom({ One: 'carol', Two: null })));
  });

  it('rejects unauthenticated users', async () => {
    const anonymous = doc(env.unauthenticatedContext().firestore(), 'rooms', ROOM_ID);
    await assertFails(setDoc(anonymous, newRoom({ One: null, Two: null })));
  });
});

describe('claiming a seat', () => {
  beforeEach(async () => {
    await seed({ One: 'alice', Two: null });
  });

  it('lets a new user take the free seat', async () => {
    await assertSucceeds(updateDoc(room('bob'), { 'players.Two': 'bob' }));
  });

  it('does not let a seated player take the second seat', async () => {
    await assertFails(updateDoc(room('alice'), { 'players.Two': 'alice' }));
  });

  it('does not let anyone take an occupied seat', async () => {
    await assertFails(updateDoc(room('bob'), { 'players.One': 'bob' }));
  });

  it('does not let anyone join a full room', async () => {
    await assertSucceeds(updateDoc(room('bob'), { 'players.Two': 'bob' }));
    await assertFails(updateDoc(room('carol'), { 'players.Two': 'carol' }));
  });

  it('does not allow adding seats or seating someone else', async () => {
    await assertFails(updateDoc(room('bob'), { 'players.Three': 'bob' }));
    await assertFails(updateDoc(room('bob'), { 'players.Two': 'carol' }));
  });

  it('does not allow changing the game while claiming', async () => {
    await assertFails(updateDoc(room('bob'), { 'players.Two': 'bob', 'state.turn': 'Two' }));
    await assertFails(updateDoc(room('bob'), { 'players.Two': 'bob', game: 'chess' }));
  });
});

describe('moving', () => {
  beforeEach(async () => {
    await seedGame();
  });

  it('lets the current player move one step', async () => {
    await assertSucceeds(play('alice', { playerOnePos: { row: 14, col: 8 }, turn: 'Two' }));
  });

  it('rejects moves out of turn', async () => {
    await assertFails(play('bob', { playerTwoPos: { row: 2, col: 8 }, turn: 'One' }));
  });

  it('rejects moving the opponent pawn', async () => {
    await assertFails(play('alice', { playerTwoPos: { row: 2, col: 8 }, turn: 'Two' }));
  });

  it('rejects moves that keep the turn', async () => {
    await assertFails(play('alice', { playerOnePos: { row: 14, col: 8 } }));
  });

  it('rejects teleporting and off-board moves', async () => {
    await assertFails(play('alice', { playerOnePos: { row: 8, col: 8 }, turn: 'Two' }));
    await assertFails(play('alice', { playerOnePos: { row: 18, col: 8 }, turn: 'Two' }));
    await assertFails(play('alice', { playerOnePos: { row: 15, col: 8 }, turn: 'Two' }));
  });

  it('rejects outsiders', async () => {
    await assertFails(play('carol', { playerOnePos: { row: 14, col: 8 }, turn: 'Two' }));
  });

  it('rejects moves before the second player joins', async () => {
    await seed({ One: 'alice', Two: null });
    await assertFails(play('alice', { playerOnePos: { row: 14, col: 8 }, turn: 'Two' }));
  });

  it('rejects changing fields outside the game state', async () => {
    await assertFails(
      updateDoc(room('alice'), { 'state.playerOnePos': { row: 14, col: 8 }, 'state.turn': 'Two', game: 'chess' })
    );
    await assertFails(
      updateDoc(room('alice'), { 'state.playerOnePos': { row: 14, col: 8 }, 'state.turn': 'Two', expiresAt: null })
    );
  });

  it('only allows declaring a winner on the goal row', async () => {
    await assertFails(play('alice', { playerOnePos: { row: 14, col: 8 }, turn: 'Two', winner: 'One' }));

    await seedGame({ playerOnePos: { row: 2, col: 6 } });
    await assertFails(play('alice', { playerOnePos: { row: 0, col: 6 }, turn: 'Two' }));
    await assertSucceeds(play('alice', { playerOnePos: { row: 0, col: 6 }, turn: 'Two', winner: 'One' }));
  });

  it('does not allow moving onto the opponent', async () => {
    await seedGame({ playerOnePos: { row: 2, col: 8 } });
    await assertFails(play('alice', { playerOnePos: { row: 0, col: 8 }, turn: 'Two' }));
  });

  it('blocks moves after the game is over', async () => {
    await seedGame({ winner: 'Two' });
    await assertFails(play('alice', { playerOnePos: { row: 14, col: 8 }, turn: 'Two' }));
  });
});

describe('placing walls', () => {
  const wall = { row: 1, col: 3, orientation: 'horizontal' };

  beforeEach(async () => {
    await seedGame();
  });

  it('lets the current player place a wall', async () => {
    await assertSucceeds(play('alice', { walls: [wall], playerOneWallsLeft: 9, turn: 'Two' }));
  });

  it('requires spending exactly one wall', async () => {
    await assertFails(play('alice', { walls: [wall], turn: 'Two' }));
    await assertFails(play('alice', { walls: [wall], playerOneWallsLeft: 8, turn: 'Two' }));
    await assertFails(play('alice', { walls: [wall], playerTwoWallsLeft: 9, turn: 'Two' }));
  });

  it('rejects malformed walls and multiple walls at once', async () => {
    await assertFails(play('alice', { walls: [{ ...wall, row: 2 }], playerOneWallsLeft: 9, turn: 'Two' }));
    await assertFails(
      play('alice', { walls: [{ ...wall, orientation: 'diagonal' }], playerOneWallsLeft: 9, turn: 'Two' })
    );
    await assertFails(play('alice', { walls: [wall, wall], playerOneWallsLeft: 9, turn: 'Two' }));
  });

  it('does not allow changing walls that are already placed', async () => {
    await seedGame({ walls: [wall], playerOneWallsLeft: 9 });
    const other = { row: 5, col: 5, orientation: 'vertical' };
    await assertFails(play('alice', { walls: [other, other], playerOneWallsLeft: 8, turn: 'Two' }));
    await assertSucceeds(play('alice', { walls: [wall, other], playerOneWallsLeft: 8, turn: 'Two' }));
  });

  it('does not allow placing without walls left', async () => {
    await seedGame({ playerOneWallsLeft: 0 });
    await assertFails(play('alice', { walls: [wall], playerOneWallsLeft: -1, turn: 'Two' }));
  });
});

describe('restarting', () => {
  const finished = { playerOnePos: { row: 0, col: 8 }, playerOneWallsLeft: 7, turn: 'Two', winner: 'One' };

  it('lets either player reset a finished game', async () => {
    await seedGame(finished);
    await assertSucceeds(updateDoc(room('bob'), { state: INITIAL_GAME }));
  });

  it('does not allow resetting a game in progress', async () => {
    await seedGame({ playerOnePos: { row: 10, col: 8 } });
    await assertFails(updateDoc(room('alice'), { state: INITIAL_GAME }));
  });

  it('does not let outsiders reset or players change seats while resetting', async () => {
    await seedGame(finished);
    await assertFails(updateDoc(room('carol'), { state: INITIAL_GAME }));
    await assertFails(updateDoc(room('alice'), { state: INITIAL_GAME, 'players.Two': 'carol' }));
  });

  it('requires a full reset', async () => {
    await seedGame(finished);
    await assertFails(updateDoc(room('alice'), { state: { ...INITIAL_GAME, playerOneWallsLeft: 7 } }));
  });
});

describe('deleting', () => {
  it('is never allowed', async () => {
    await seedGame();
    await assertFails(deleteDoc(room('alice')));
  });
});
