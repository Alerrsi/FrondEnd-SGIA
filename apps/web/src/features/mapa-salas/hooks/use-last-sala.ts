import { useCallback } from 'react';

const STORAGE_KEY = 'sgia-mapa-sala';

/** Última sala vista en el mapa, solo en este navegador. Sin almacenamiento disponible, no recuerda nada. */
export function readLastSala(): number | null {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function useLastSala() {
  const remember = useCallback((locationId: number) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(locationId));
    } catch {
      // Sin almacenamiento (modo privado o bloqueado): no es necesario recordar.
    }
  }, []);

  return { lastSala: readLastSala(), remember };
}
