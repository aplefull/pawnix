// LIBRARIES
import { useCallback, useState } from 'react';
// UTILS
import { getStoredName, isValidName, storeName } from '@utils';

export const usePlayerName = () => {
  const [name, setName] = useState(getStoredName);

  const updateName = useCallback((value: string) => {
    setName(value);
    storeName(value);
  }, []);

  return { name, setName: updateName, isValid: isValidName(name) };
};
