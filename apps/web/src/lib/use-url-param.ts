import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Estado de pantalla guardado en la URL (`?clave=valor`); el valor por defecto no se escribe. */
export function useUrlParam(key: string, fallback = ''): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? fallback;
  const set = useCallback(
    (next: string) =>
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev);
          if (next === '' || next === fallback) copy.delete(key);
          else copy.set(key, next);
          return copy;
        },
        { replace: true },
      ),
    [key, fallback, setParams],
  );
  return [value, set];
}
