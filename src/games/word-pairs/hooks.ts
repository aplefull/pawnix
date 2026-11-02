// LIBRARIES
import { useEffect, useState } from 'react';
// SERVICES
import { subscribeSecret } from '@services';
// UTILS
import { logger } from '@utils';
// TYPES
import type { Seat, Secret } from './types';

export const useSecret = (roomId: string | null, seat: Seat | null, round: number) => {
  const [secret, setSecret] = useState<Secret | null>(null);

  useEffect(() => {
    if (!roomId || !seat) {
      setSecret(null);
      return;
    }

    return subscribeSecret<Secret>(roomId, seat, setSecret, (error) => {
      logger.error(error);
      setSecret(null);
    });
  }, [roomId, seat]);

  return secret?.round === round ? secret : null;
};
