// LIBRARIES
import type { Timestamp } from 'firebase/firestore';

export type Seats = Record<string, string | null>;

export type RoomDoc<TState = unknown> = {
  game: string;
  players: Seats;
  state: TState;
  createdAt: Timestamp;
  expiresAt: Timestamp;
};
