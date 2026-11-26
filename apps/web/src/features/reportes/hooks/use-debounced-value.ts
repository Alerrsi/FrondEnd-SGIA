import { useEffect, useState } from 'react';

/** El valor, `delayMs` después de su último cambio. Pensado para primitivos (compara con `Object.is`). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
