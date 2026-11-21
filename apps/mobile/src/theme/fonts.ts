import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono/400Regular';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';
import { useFonts } from 'expo-font';

import { fonts } from './typography';

/** Carga Geist y Geist Mono (solo los cortes que usa la escala). Devuelve `true` cuando están listas. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fonts.regular]: Geist_400Regular,
    [fonts.medium]: Geist_500Medium,
    [fonts.semibold]: Geist_600SemiBold,
    [fonts.code]: GeistMono_400Regular,
    [fonts.codeMedium]: GeistMono_500Medium,
  });
  // Si una fuente falla, la app sigue con la del sistema antes que quedarse en el splash.
  return loaded || Boolean(error);
}
