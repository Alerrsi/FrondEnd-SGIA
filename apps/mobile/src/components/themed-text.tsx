import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { MUTED_VARIANTS, type, type ThemeColor, type TypeVariant } from '@/theme';

export type ThemedTextProps = TextProps & {
  /** Paso de la escala «Trazo» (`src/theme/typography.ts`). */
  variant?: TypeVariant;
  /** Color de la paleta; por defecto tinta (o secundario en `subtitle` y `secondary`). */
  tone?: ThemeColor;
};

export function ThemedText({ style, variant = 'body', tone, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[tone ?? (MUTED_VARIANTS.includes(variant) ? 'inkMuted' : 'ink')];
  return <Text style={[type[variant], { color }, style]} {...rest} />;
}
