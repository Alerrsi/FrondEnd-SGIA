import { palettes, type ThemeName, type ThemePalette } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Paleta «Trazo» del modo del sistema (sin interruptor propio en la app). */
export function useTheme(): ThemePalette {
  return palettes[useThemeName()];
}

export function useThemeName(): ThemeName {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}
