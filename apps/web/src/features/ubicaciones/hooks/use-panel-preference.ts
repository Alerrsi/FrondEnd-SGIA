import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sgia-ubicaciones-panel';

function readOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'closed';
  } catch {
    return true;
  }
}

/** Panel lateral de Ubicaciones acoplado: abierto por defecto y recordado entre visitas. */
export function usePanelPreference(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(readOpen);
  const update = useCallback((next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'open' : 'closed');
    } catch {
      // Sin almacenamiento (modo privado): vale solo para esta visita.
    }
  }, []);
  return [open, update];
}
