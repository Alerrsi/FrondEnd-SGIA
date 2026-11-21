import type { TextStyle } from 'react-native';

/**
 * Geist en la interfaz, Geist Mono solo para identificadores (SKU, códigos de solicitud o informe, seriales).
 * Con fuentes estáticas el peso va en `fontFamily`, nunca en `fontWeight`.
 */
export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  code: 'GeistMono_400Regular',
  codeMedium: 'GeistMono_500Medium',
} as const;

/** Escala del web (sgia-design §2): pesos 400/500, 600 solo en cifras, nada bajo 12 px, tipo oración. */
export const type = {
  hero: { fontFamily: fonts.medium, fontSize: 26, lineHeight: 32, letterSpacing: -0.9 },
  title: { fontFamily: fonts.medium, fontSize: 24, lineHeight: 30, letterSpacing: -0.48 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  section: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  secondary: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  metric: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  code: { fontFamily: fonts.code, fontSize: 13, lineHeight: 18 },
  codeSmall: { fontFamily: fonts.code, fontSize: 12, lineHeight: 16 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

/** Variantes que van en texto secundario por defecto. */
export const MUTED_VARIANTS: readonly TypeVariant[] = ['subtitle', 'secondary'];
