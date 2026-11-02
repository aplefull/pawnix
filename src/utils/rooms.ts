// STORE
import type { Seats } from '@store';
// CONSTANTS
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@constants';

const ROOM_CODE_REGEX = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

export const generateRoomCode = () => {
  const values = crypto.getRandomValues(new Uint32Array(ROOM_CODE_LENGTH));

  return Array.from(values, (value) => ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length]).join('');
};

export const normalizeRoomCode = (value: string) => {
  return value.trim().toUpperCase();
};

export const isRoomCode = (value: string) => {
  return ROOM_CODE_REGEX.test(value);
};

export const getSeatOf = (players: Seats, uid: string) => {
  return Object.keys(players).find((seat) => players[seat] === uid) ?? null;
};

export const getFreeSeat = (players: Seats) => {
  return (
    Object.keys(players)
      .sort()
      .find((seat) => players[seat] === null) ?? null
  );
};

export const isRoomFull = (players: Seats) => {
  return Object.values(players).every((uid) => uid !== null);
};
