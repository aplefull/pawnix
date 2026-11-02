// CONSTANTS
import { gifs } from '@constants';

export const notNull = <T>(value: T | null): value is T => {
  return value !== null;
};

const sample = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const getRandomGif = (isWinner: boolean) => {
  return isWinner ? sample(gifs.win) : sample(gifs.lose);
};
