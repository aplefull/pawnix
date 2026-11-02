// CONSTANTS
import { NAME_MAX_LENGTH, NAME_STORAGE_KEY } from '@constants';

export const normalizeName = (value: string) => {
  return value.trim().replace(/\s+/g, ' ');
};

export const isValidName = (value: string) => {
  const name = normalizeName(value);

  return name.length > 0 && name.length <= NAME_MAX_LENGTH;
};

export const getStoredName = () => {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

export const storeName = (value: string) => {
  try {
    localStorage.setItem(NAME_STORAGE_KEY, value);
  } catch {}
};
