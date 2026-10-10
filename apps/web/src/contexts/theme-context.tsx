import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export type ColorPalette = 'default' | 'b1';

export interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  isSystem: boolean;
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
}

const STORAGE_KEY = 'sgia-theme';
const PALETTE_STORAGE_KEY = 'sgia-palette';

const defaultThemeValue: ThemeContextValue = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  isSystem: true,
  palette: 'default',
  setPalette: () => {},
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

function getInitialPalette(): ColorPalette {
  if (typeof window === 'undefined') return 'default';
  const saved = localStorage.getItem(PALETTE_STORAGE_KEY) as ColorPalette | null;
  if (saved === 'default' || saved === 'b1') {
    return saved;
  }
  return 'default';
}

function getSystemMediaMatches(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(getInitialPreference);
  const [palette, setPaletteState] = useState<ColorPalette>(getInitialPalette);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(getSystemMediaMatches);

  // Escuchar en tiempo real los cambios del sistema operativo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determinar el tema resuelto ('light' o 'dark')
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemIsDark ? 'dark' : 'light';
    }
    return theme;
  }, [theme, systemIsDark]);

  // Aplicar clases y atributos al elemento raíz para activar Tailwind y variables CSS
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    root.setAttribute('data-theme', resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Aplicar atributos y clases para la paleta de colores activa
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-palette', palette);
    if (palette === 'b1') {
      root.classList.add('palette-b1');
    } else {
      root.classList.remove('palette-b1');
    }
  }, [palette]);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme);
    }
  }, []);

  const setPalette = useCallback((newPalette: ColorPalette) => {
    setPaletteState(newPalette);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PALETTE_STORAGE_KEY, newPalette);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      let next: ThemePreference;
      if (current === 'system') {
        // Al alternar desde sistema, pasar al tema resuelto opuesto
        next = resolvedTheme === 'dark' ? 'light' : 'dark';
      } else if (current === 'light') {
        next = 'dark';
      } else {
        // Ciclo completo: dark -> system
        next = 'system';
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isSystem: theme === 'system',
      palette,
      setPalette,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, palette, setPalette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context ?? defaultThemeValue;
}
