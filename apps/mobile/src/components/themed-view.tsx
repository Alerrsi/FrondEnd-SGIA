import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ThemeColor } from '@/theme';

export type ThemedViewProps = ViewProps & {
  /** Fondo de la paleta: `bg` (canvas, por defecto), `surface` o `surfaceAlt`. */
  surface?: Extract<ThemeColor, 'bg' | 'surface' | 'surfaceAlt'>;
};

export function ThemedView({ style, surface = 'bg', ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  return <View style={[{ backgroundColor: theme[surface] }, style]} {...otherProps} />;
}
