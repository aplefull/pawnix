// LIBRARIES
import { useEffect, useState } from 'react';
// UTILS
import { logger } from '@utils';

const loadRealtime = () => import('@services/realtime');

export const useLive = <TLive>(roomId: string | null, uid: string | null) => {
  const [value, setValue] = useState<TLive | null>(null);

  useEffect(() => {
    if (!roomId || !uid) {
      setValue(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    loadRealtime()
      .then(({ subscribeLive }) => {
        if (cancelled) return;
        unsubscribe = subscribeLive<TLive>(roomId, uid, setValue);
      })
      .catch(logger.error);

    return () => {
      cancelled = true;
      unsubscribe?.();
      setValue(null);
    };
  }, [roomId, uid]);

  return value;
};

export const usePublishLive = <TLive extends object>(roomId: string | null, uid: string | null, live: TLive | null) => {
  useEffect(() => {
    if (!roomId || !uid || !live) return;

    loadRealtime()
      .then(({ setLive }) => setLive(roomId, uid, live))
      .catch(logger.error);
  }, [roomId, uid, live]);

  useEffect(() => {
    if (!roomId || !uid) return;

    return () => {
      loadRealtime()
        .then(({ setLive }) => setLive(roomId, uid, null))
        .catch(logger.error);
    };
  }, [roomId, uid]);
};
