// CONSTANTS
import { gifs } from '@constants';

export const notNull = <T>(value: T | null): value is T => {
  return value !== null;
};

const sample = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => {
  return UUID_REGEX.test(value);
};

export const getRandomGif = (isWinner: boolean) => {
  return isWinner ? sample(gifs.win) : sample(gifs.lose);
};
