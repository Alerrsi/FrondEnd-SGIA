import raw from './tokens.json';

export const palette = {
  background: raw.colors.background,
  surface: raw.colors.surface,
  surfaceRaised: raw.colors['surface-raised'],
  border: raw.colors.border,
  borderStrong: raw.colors['border-strong'],
  text: raw.colors.text,
  textMuted: raw.colors['text-muted'],
  accent: raw.colors.accent,
  accentMuted: raw.colors['accent-muted'],
  success: raw.colors.success,
  warning: raw.colors.warning,
  danger: raw.colors.danger,
} as const;

export const fonts = {
  sans: raw.fontFamily.sans,
  mono: raw.fontFamily.mono,
} as const;

export const radii = {
  md: raw.borderRadius.md,
  lg: raw.borderRadius.lg,
} as const;

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
} as const;

export const spacing = {
  px: '1px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export type DesignTokens = {
  palette: typeof palette;
  fonts: typeof fonts;
  fontSizes: typeof fontSizes;
  spacing: typeof spacing;
  radii: typeof radii;
};

export const designTokens: DesignTokens = { palette, fonts, fontSizes, spacing, radii };

export default designTokens;