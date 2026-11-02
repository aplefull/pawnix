import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const ROOM_ID = 'room-1';

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
const room = (uid: string) => doc(db(uid), 'rooms', ROOM_ID);

const seed = (data: Record<string, unknown>) =>
  env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'rooms', ROOM_ID), { createdAt: new Date(), ...data });
  });

const seedGame = (overrides: Record<string, unknown> = {}) =>
  seed({ ...INITIAL_GAME, players: { One: 'alice', Two: 'bob' }, ...overrides });

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

  it('blocks anonymous reads and listing rooms', async () => {
    await seedGame();
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'rooms', ROOM_ID)));
    await assertFails(getDocs(collection(db('carol'), 'rooms')));
  });
});

describe('creating a room', () => {
  const newRoom = (players: Record<string, string | null>, overrides: Record<string, unknown> = {}) => ({
    ...INITIAL_GAME,
    players,
    createdAt: serverTimestamp(),
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
  });

  it('rejects rooms that do not start from the initial position', async () => {
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice', Two: null }, { playerOneWallsLeft: 20 })));
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice', Two: null }, { turn: 'Two' })));
    await assertFails(setDoc(room('alice'), newRoom({ One: 'alice', Two: null }, { extra: true })));
  });

  it('rejects unauthenticated users', async () => {
    const anonymous = doc(env.unauthenticatedContext().firestore(), 'rooms', ROOM_ID);
    await assertFails(setDoc(anonymous, newRoom({ One: null, Two: null })));
  });
});

describe('claiming a seat', () => {
  beforeEach(async () => {
    await seed({ ...INITIAL_GAME, players: { One: 'alice', Two: null } });
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

  it('does not allow changing the game while claiming', async () => {
    await assertFails(updateDoc(room('bob'), { 'players.Two': 'bob', turn: 'Two' }));
  });
});

describe('moving', () => {
  beforeEach(async () => {
    await seedGame();
  });

  it('lets the current player move one step', async () => {
    await assertSucceeds(updateDoc(room('alice'), { playerOnePos: { row: 14, col: 8 }, turn: 'Two' }));
  });

  it('rejects moves out of turn', async () => {
    await assertFails(updateDoc(room('bob'), { playerTwoPos: { row: 2, col: 8 }, turn: 'One' }));
  });

  it('rejects moving the opponent pawn', async () => {
    await assertFails(updateDoc(room('alice'), { playerTwoPos: { row: 2, col: 8 }, turn: 'Two' }));
  });

  it('rejects moves that keep the turn', async () => {
    await assertFails(updateDoc(room('alice'), { playerOnePos: { row: 14, col: 8 } }));
  });

  it('rejects teleporting and off-board moves', async () => {
    await assertFails(updateDoc(room('alice'), { playerOnePos: { row: 8, col: 8 }, turn: 'Two' }));
    await assertFails(updateDoc(room('alice'), { playerOnePos: { row: 18, col: 8 }, turn: 'Two' }));
    await assertFails(updateDoc(room('alice'), { playerOnePos: { row: 15, col: 8 }, turn: 'Two' }));
  });

  it('rejects outsiders', async () => {
    await assertFails(updateDoc(room('carol'), { playerOnePos: { row: 14, col: 8 }, turn: 'Two' }));
  });

  it('only allows declaring a winner on the goal row', async () => {
    await assertFails(updateDoc(room('alice'), { playerOnePos: { row: 14, col: 8 }, turn: 'Two', winner: 'One' }));

    await seedGame({ playerOnePos: { row: 2, col: 6 } });
    await assertFails(updateDoc(room('alice'), { playerOnePos: { row: 0, col: 6 }, turn: 'Two' }));
    await assertSucceeds(updateDoc(room('alice'), { playerOnePos: { row: 0, col: 6 }, turn: 'Two', winner: 'One' }));
  });

  it('does not allow moving onto the opponent', async () => {
    await seedGame({ playerOnePos: { row: 2, col: 8 } });
    await assertFails(updateDoc(room('alice'), { playerOnePos: { row: 0, col: 8 }, turn: 'Two' }));
  });

  it('blocks moves after the game is over', async () => {
    await seedGame({ winner: 'Two' });
    await assertFails(updateDoc(room('alice'), { playerOnePos: { row: 14, col: 8 }, turn: 'Two' }));
  });
});

describe('placing walls', () => {
  const wall = { row: 1, col: 3, orientation: 'horizontal' };

  beforeEach(async () => {
    await seedGame();
  });

  it('lets the current player place a wall', async () => {
    await assertSucceeds(updateDoc(room('alice'), { walls: [wall], playerOneWallsLeft: 9, turn: 'Two' }));
  });

  it('requires spending exactly one wall', async () => {
    await assertFails(updateDoc(room('alice'), { walls: [wall], turn: 'Two' }));
    await assertFails(updateDoc(room('alice'), { walls: [wall], playerOneWallsLeft: 8, turn: 'Two' }));
    await assertFails(updateDoc(room('alice'), { walls: [wall], playerTwoWallsLeft: 9, turn: 'Two' }));
  });

  it('rejects malformed walls and multiple walls at once', async () => {
    await assertFails(updateDoc(room('alice'), { walls: [{ ...wall, row: 2 }], playerOneWallsLeft: 9, turn: 'Two' }));
    await assertFails(
      updateDoc(room('alice'), { walls: [{ ...wall, orientation: 'diagonal' }], playerOneWallsLeft: 9, turn: 'Two' })
    );
    await assertFails(updateDoc(room('alice'), { walls: [wall, wall], playerOneWallsLeft: 9, turn: 'Two' }));
  });

  it('does not allow changing walls that are already placed', async () => {
    await seedGame({ walls: [wall], playerOneWallsLeft: 9 });
    const other = { row: 5, col: 5, orientation: 'vertical' };
    await assertFails(updateDoc(room('alice'), { walls: [other, other], playerOneWallsLeft: 8, turn: 'Two' }));
    await assertSucceeds(updateDoc(room('alice'), { walls: [wall, other], playerOneWallsLeft: 8, turn: 'Two' }));
  });

  it('does not allow placing without walls left', async () => {
    await seedGame({ playerOneWallsLeft: 0 });
    await assertFails(updateDoc(room('alice'), { walls: [wall], playerOneWallsLeft: -1, turn: 'Two' }));
  });
});

describe('restarting', () => {
  const finished = { playerOnePos: { row: 0, col: 8 }, playerOneWallsLeft: 7, turn: 'Two', winner: 'One' };

  it('lets either player reset a finished game', async () => {
    await seedGame(finished);
    await assertSucceeds(setDoc(room('bob'), INITIAL_GAME, { merge: true }));
  });

  it('does not allow resetting a game in progress', async () => {
    await seedGame({ playerOnePos: { row: 10, col: 8 } });
    await assertFails(setDoc(room('alice'), INITIAL_GAME, { merge: true }));
  });

  it('does not let outsiders reset or players change seats while resetting', async () => {
    await seedGame(finished);
    await assertFails(setDoc(room('carol'), INITIAL_GAME, { merge: true }));
    await assertFails(
      setDoc(room('alice'), { ...INITIAL_GAME, players: { One: 'alice', Two: 'carol' } }, { merge: true })
    );
  });

  it('requires a full reset', async () => {
    await seedGame(finished);
    await assertFails(setDoc(room('alice'), { ...INITIAL_GAME, playerOneWallsLeft: 7 }, { merge: true }));
  });
});

describe('deleting', () => {
  it('is never allowed', async () => {
    await seedGame();
    await assertFails(deleteDoc(room('alice')));
  });
});
