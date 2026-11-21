import { themes, type ThemeName, type ThemePalette } from '@sgia/design-tokens';

/**
 * Paletas «Trazo» (las mismas del web, desde `@sgia/design-tokens`). Se leen con `useTheme()`;
 * ningún archivo fuera de `src/theme/` escribe un color.
 */
export const palettes = themes;
export type { ThemeName, ThemePalette };
export type ThemeColor = keyof ThemePalette;

/** Estados de dominio (préstamo, informe): siempre con texto, nunca solo color. */
export type Tone = 'neutral' | 'accent' | 'ok' | 'info' | 'warn' | 'danger';

export function toneColors(palette: ThemePalette, tone: Tone): { fg: string; bg: string } {
  switch (tone) {
    case 'accent':
      return { fg: palette.accent, bg: palette.accentSoft };
    case 'ok':
      return { fg: palette.ok, bg: palette.okBg };
    case 'info':
      return { fg: palette.info, bg: palette.infoBg };
    case 'warn':
      return { fg: palette.warn, bg: palette.warnBg };
    case 'danger':
      return { fg: palette.danger, bg: palette.dangerBg };
    default:
      return { fg: palette.inkMuted, bg: palette.surfaceAlt };
  }
}

/** Velo de los modales y hojas (único negro con transparencia permitido). */
export const scrim = 'rgba(19, 18, 16, 0.45)';

/**
 * Hoja de la firma: siempre papel blanco con tinta grafito, también en oscuro, porque se guarda como
 * imagen del documento (la firma no cambia con el tema).
 */
export const signaturePaper = { paper: themes.light.surface, ink: themes.light.ink } as const;
