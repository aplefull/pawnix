// LIBRARIES
import {
  connectDatabaseEmulator,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  type Unsubscribe,
} from 'firebase/database';
// UTILS
import { logger } from '@utils';
// SERVICES
import { app, isEmulatorMode } from './firebase';

const rtdb = getDatabase(app);

if (isEmulatorMode) {
  connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
}

const getPresenceRef = (roomId: string, uid: string) => ref(rtdb, `rooms/${roomId}/presence/${uid}`);

const getLiveRef = (roomId: string, uid: string) => ref(rtdb, `rooms/${roomId}/live/${uid}`);

export const trackPresence = (roomId: string, uid: string): Unsubscribe => {
  const ownRef = getPresenceRef(roomId, uid);

  const unsubscribe = onValue(ref(rtdb, '.info/connected'), async (snapshot) => {
    if (snapshot.val() !== true) return;

    try {
      await onDisconnect(ownRef).remove();
      await set(ownRef, serverTimestamp());
    } catch (error) {
      logger.error(error);
    }
  });

  return () => {
    unsubscribe();
    onDisconnect(ownRef).cancel();
    remove(ownRef).catch(logger.error);
  };
};

export const subscribePresence = (roomId: string, onChange: (uids: string[]) => void): Unsubscribe => {
  return onValue(
    ref(rtdb, `rooms/${roomId}/presence`),
    (snapshot) => {
      onChange(Object.keys(snapshot.val() ?? {}));
    },
    logger.error
  );
};

export const setLive = async <TLive extends object>(roomId: string, uid: string, value: TLive | null) => {
  const liveRef = getLiveRef(roomId, uid);

  if (value === null) {
    await onDisconnect(liveRef).cancel();
    await remove(liveRef);
    return;
  }

  await onDisconnect(liveRef).remove();
  await set(liveRef, value);
};

export const subscribeLive = <TLive>(
  roomId: string,
  uid: string,
  onChange: (value: TLive | null) => void
): Unsubscribe => {
  return onValue(
    getLiveRef(roomId, uid),
    (snapshot) => {
      onChange(snapshot.val());
    },
    logger.error
  );
};
