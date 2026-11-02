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
} from 'firebase/firestore';
// STORE
import type { RoomDoc } from '@store';
// CONSTANTS
import { ROOM_CODE_ATTEMPTS, ROOM_TTL_DAYS } from '@constants';
// UTILS
import { generateRoomCode, getFreeSeat, getSeatOf } from '@utils';
// SERVICES
import { db, ensureSignedIn } from './firebase';

type TCreateRoomOptions<TState> = {
  game: string;
  seats: readonly string[];
  seat: string;
  state: TState;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getRoomRef = (roomId: string) => doc(db, 'rooms', roomId);

export const createRoom = async <TState>({ game, seats, seat, state }: TCreateRoomOptions<TState>) => {
  const user = await ensureSignedIn();
  const players = Object.fromEntries(seats.map((value) => [value, value === seat ? user.uid : null]));

  for (let attempt = 0; attempt < ROOM_CODE_ATTEMPTS; attempt++) {
    const roomId = generateRoomCode();
    const roomRef = getRoomRef(roomId);

    const created = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(roomRef);

      if (docSnap.exists()) return false;

      transaction.set(roomRef, {
        game,
        players,
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

export const claimSeat = (roomId: string, uid: string) => {
  const roomRef = getRoomRef(roomId);

  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(roomRef);

    if (!docSnap.exists()) {
      throw new Error(`Room ${roomId} does not exist`);
    }

    const { players } = docSnap.data() as RoomDoc;

    const ownSeat = getSeatOf(players, uid);
    if (ownSeat) return ownSeat;

    const freeSeat = getFreeSeat(players);
    if (!freeSeat) throw new Error('This room is full. All seats are already taken.');

    transaction.update(roomRef, { [`players.${freeSeat}`]: uid });
    return freeSeat;
  });
};

export const subscribeRoom = (
  roomId: string,
  onChange: (room: RoomDoc | null) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe => {
  return onSnapshot(
    getRoomRef(roomId),
    (docSnap) => {
      onChange(docSnap.exists() ? (docSnap.data() as RoomDoc) : null);
    },
    onError
  );
};

export const updateRoomState = <TState extends object>(roomId: string, patch: Partial<TState>) => {
  const update = Object.fromEntries(Object.entries(patch).map(([key, value]) => [`state.${key}`, value]));

  return updateDoc(getRoomRef(roomId), update);
};

export const resetRoomState = <TState extends object>(roomId: string, state: TState) => {
  return updateDoc(getRoomRef(roomId), { state });
};
