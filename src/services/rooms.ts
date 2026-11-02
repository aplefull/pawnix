// LIBRARIES
import {
  doc,
  type FirestoreError,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
// STORE
import type { RoomDoc } from '@store';
// CONSTANTS
import { ROOM_CODE_ATTEMPTS, ROOM_TTL_DAYS } from '@constants';
// UTILS
import { generateRoomCode, getFreeSeat, getSeatOf, isValidName, normalizeName } from '@utils';
// SERVICES
import { db, ensureSignedIn } from './firebase';

type TCreateRoomOptions<TState> = {
  game: string;
  seats: readonly string[];
  seat: string;
  name: string;
  state: TState;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export class NameRequiredError extends Error {
  game: string;

  constructor(game: string) {
    super('A name is required to join this room.');
    this.name = 'NameRequiredError';
    this.game = game;
  }
}

const getRoomRef = (roomId: string) => doc(db, 'rooms', roomId);

const getSecretRef = (roomId: string, seat: string) => doc(db, 'rooms', roomId, 'private', seat);

export const createRoom = async <TState>({ game, seats, seat, name, state }: TCreateRoomOptions<TState>) => {
  const user = await ensureSignedIn();
  const players = Object.fromEntries(seats.map((value) => [value, value === seat ? user.uid : null]));
  const names = Object.fromEntries(seats.map((value) => [value, value === seat ? normalizeName(name) : null]));

  for (let attempt = 0; attempt < ROOM_CODE_ATTEMPTS; attempt++) {
    const roomId = generateRoomCode();
    const roomRef = getRoomRef(roomId);

    const created = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(roomRef);

      if (docSnap.exists()) return false;

      transaction.set(roomRef, {
        game,
        players,
        names,
        state,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + ROOM_TTL_DAYS * DAY_MS),
      });

      return true;
    });

    if (created) return roomId;
  }

  throw new Error("Couldn't find a free room code");
};

export const fetchRoom = async (roomId: string) => {
  const docSnap = await getDoc(getRoomRef(roomId));

  return docSnap.exists() ? (docSnap.data() as RoomDoc) : null;
};

export const claimSeat = (roomId: string, uid: string, name: string) => {
  const roomRef = getRoomRef(roomId);

  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(roomRef);

    if (!docSnap.exists()) {
      throw new Error(`Room ${roomId} does not exist`);
    }

    const { game, players } = docSnap.data() as RoomDoc;

    const ownSeat = getSeatOf(players, uid);
    if (ownSeat) return ownSeat;

    const freeSeat = getFreeSeat(players);
    if (!freeSeat) throw new Error('This room is full. All seats are already taken.');

    if (!isValidName(name)) throw new NameRequiredError(game);

    transaction.update(roomRef, { [`players.${freeSeat}`]: uid, [`names.${freeSeat}`]: normalizeName(name) });
    return freeSeat;
  });
};

export const subscribeRoom = (
  roomId: string,
  onChange: (room: RoomDoc | null, synced: boolean) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe => {
  return onSnapshot(
    getRoomRef(roomId),
    { includeMetadataChanges: true },
    (docSnap) => {
      onChange(docSnap.exists() ? (docSnap.data() as RoomDoc) : null, !docSnap.metadata.hasPendingWrites);
    },
    onError
  );
};

const toStateUpdate = (patch: object) => {
  return Object.fromEntries(Object.entries(patch).map(([key, value]) => [`state.${key}`, value]));
};

export const updateRoomState = <TState extends object>(roomId: string, patch: Partial<TState>) => {
  return updateDoc(getRoomRef(roomId), toStateUpdate(patch));
};

export const fetchSecret = async <TSecret>(roomId: string, seat: string) => {
  const docSnap = await getDoc(getSecretRef(roomId, seat));

  return docSnap.exists() ? (docSnap.data() as TSecret) : null;
};

export const subscribeSecret = <TSecret>(
  roomId: string,
  seat: string,
  onChange: (secret: TSecret | null) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe => {
  return onSnapshot(
    getSecretRef(roomId, seat),
    (docSnap) => {
      onChange(docSnap.exists() ? (docSnap.data() as TSecret) : null);
    },
    onError
  );
};

export const updateRoomStateWithSecret = <TState extends object, TSecret extends object>(
  roomId: string,
  seat: string,
  secret: TSecret,
  patch: Partial<TState>
) => {
  const batch = writeBatch(db);

  batch.set(getSecretRef(roomId, seat), secret);
  batch.update(getRoomRef(roomId), toStateUpdate(patch));

  return batch.commit();
};

export const resetRoomState = <TState extends object>(roomId: string, state: TState) => {
  return updateDoc(getRoomRef(roomId), { state });
};
