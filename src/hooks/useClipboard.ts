// LIBRARIES
import { useCallback, useEffect, useRef, useState } from 'react';

const RESET_DELAY = 1500;

export const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  const copy = useCallback(async (value: string) => {
    await navigator.clipboard.writeText(value);

    setCopied(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), RESET_DELAY);
  }, []);

  return { copied, copy };
};
