// LIBRARIES
import { useEffect, useState } from 'react';
// STORE
import { usePresenceStore } from '@store';
// CONSTANTS
import { OFFLINE_GRACE_MS } from '@constants';
// UTILS
import { logger } from '@utils';

export const usePresenceSync = (roomId: string | null, uid: string | null) => {
  useEffect(() => {
    if (!roomId || !uid) return;

    const { setOnline } = usePresenceStore.getState();
    let cleanup: (() => void) | null = null;
    let cancelled = false;

    import('@services/realtime')
      .then(({ subscribePresence, trackPresence }) => {
        if (cancelled) return;

        const stopTracking = trackPresence(roomId, uid);
        const stopListening = subscribePresence(roomId, setOnline);

        cleanup = () => {
          stopTracking();
          stopListening();
        };
      })
      .catch(logger.error);

    return () => {
      cancelled = true;
      cleanup?.();
      setOnline([]);
    };
  }, [roomId, uid]);
};

export const useIsOnline = (uid: string | null) => {
  const isPresent = usePresenceStore((state) => uid !== null && state.online.includes(uid));
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (isPresent || !uid) {
      setIsOffline(false);
      return;
    }

    const timeout = window.setTimeout(() => setIsOffline(true), OFFLINE_GRACE_MS);

    return () => window.clearTimeout(timeout);
  }, [isPresent, uid]);

  return !isOffline;
};
