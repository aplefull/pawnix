// CONSTANTS
import { gifs } from '@constants';

export const notNull = <T>(value: T | null): value is T => {
  return value !== null;
};

const sample = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const shuffle = <T>(array: readonly T[]) => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

export const getRandomGif = (isWinner: boolean) => {
  return isWinner ? sample(gifs.win) : sample(gifs.lose);
};
