import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const ROOM = 'rooms/ABCDEF';
const NOW = { '.sv': 'timestamp' };

let env: RulesTestEnvironment;

const rtdb = (uid: string) => env.authenticatedContext(uid).database();
const anonymous = () => env.unauthenticatedContext().database();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-pawnix',
    database: { rules: readFileSync('database.rules.json', 'utf8'), host: '127.0.0.1', port: 9000 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearDatabase();
});

describe('presence', () => {
  it('lets players mark themselves online with the server time', async () => {
    await assertSucceeds(rtdb('alice').ref(`${ROOM}/presence/alice`).set(NOW));
    await assertSucceeds(rtdb('alice').ref(`${ROOM}/presence/alice`).remove());
  });

  it('does not let anyone write presence for someone else', async () => {
    await assertFails(rtdb('alice').ref(`${ROOM}/presence/bob`).set(NOW));
    await assertFails(anonymous().ref(`${ROOM}/presence/alice`).set(NOW));
  });

  it('only accepts timestamps for valid room codes', async () => {
    await assertFails(rtdb('alice').ref(`${ROOM}/presence/alice`).set('online'));
    await assertFails(
      rtdb('alice')
        .ref(`${ROOM}/presence/alice`)
        .set(Date.now() + 60_000)
    );
    await assertFails(rtdb('alice').ref('rooms/abcdef/presence/alice').set(NOW));
  });

  it('lets signed in users read a room but not list rooms', async () => {
    await assertSucceeds(rtdb('carol').ref(`${ROOM}/presence`).get());
    await assertFails(rtdb('carol').ref('rooms').get());
    await assertFails(anonymous().ref(`${ROOM}/presence`).get());
  });
});

describe('live updates', () => {
  const live = { round: 1, phase: 'guessing', picks: '20-4-' };

  it('lets players publish and clear their own live state', async () => {
    await assertSucceeds(rtdb('bob').ref(`${ROOM}/live/bob`).set(live));
    await assertSucceeds(
      rtdb('bob')
        .ref(`${ROOM}/live/bob`)
        .set({ ...live, picks: '**-*-' })
    );
    await assertSucceeds(rtdb('bob').ref(`${ROOM}/live/bob`).remove());
  });

  it('does not let anyone publish for someone else', async () => {
    await assertFails(rtdb('alice').ref(`${ROOM}/live/bob`).set(live));
  });

  it('rejects malformed live state', async () => {
    await assertFails(rtdb('bob').ref(`${ROOM}/live/bob`).set({ round: 1, phase: 'guessing' }));
    await assertFails(
      rtdb('bob')
        .ref(`${ROOM}/live/bob`)
        .set({ ...live, picks: 'abc' })
    );
    await assertFails(
      rtdb('bob')
        .ref(`${ROOM}/live/bob`)
        .set({ ...live, round: 'one' })
    );
    await assertFails(
      rtdb('bob')
        .ref(`${ROOM}/live/bob`)
        .set({ ...live, extra: true })
    );
  });
});
