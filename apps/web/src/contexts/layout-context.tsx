import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/*
 * Preferencias de presentación del rediseño «Trazo» (docs/rediseno-interfaz.md §5): versión del layout y
 * densidad de tablas. Son comodidades por navegador: se guardan en localStorage y, si el almacenamiento
 * falla, se usan los valores por defecto.
 */

export type LayoutMode = 'sidebar' | 'header';
export type Density = 'comoda' | 'compacta';

export interface LayoutPreferenceValue {
  layout: LayoutMode;
  setLayout: (layout: LayoutMode) => void;
  density: Density;
  setDensity: (density: Density) => void;
}

const LAYOUT_KEY = 'sgia-layout';
const DENSITY_KEY = 'sgia-density';

const fallback: LayoutPreferenceValue = {
  layout: 'sidebar',
  setLayout: () => {},
  density: 'comoda',
  setDensity: () => {},
};

const LayoutPreferenceContext = createContext<LayoutPreferenceValue | null>(null);

function read<T extends string>(key: string, allowed: readonly T[], initial: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved && (allowed as readonly string[]).includes(saved) ? (saved as T) : initial;
  } catch {
    return initial;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Almacenamiento bloqueado: la preferencia vale solo para esta sesión.
  }
}

export function LayoutPreferenceProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<LayoutMode>(() => read(LAYOUT_KEY, ['sidebar', 'header'] as const, 'sidebar'));
  const [density, setDensityState] = useState<Density>(() => read(DENSITY_KEY, ['comoda', 'compacta'] as const, 'comoda'));

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  const setLayout = useCallback((next: LayoutMode) => {
    setLayoutState(next);
    write(LAYOUT_KEY, next);
  }, []);

  const setDensity = useCallback((next: Density) => {
    setDensityState(next);
    write(DENSITY_KEY, next);
  }, []);

  const value = useMemo(() => ({ layout, setLayout, density, setDensity }), [layout, setLayout, density, setDensity]);
  return <LayoutPreferenceContext.Provider value={value}>{children}</LayoutPreferenceContext.Provider>;
}

export function useLayoutPreference(): LayoutPreferenceValue {
  return useContext(LayoutPreferenceContext) ?? fallback;
}
