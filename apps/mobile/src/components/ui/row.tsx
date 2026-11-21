import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { spacing, TOUCH } from '@/theme';

interface RowProps {
  children: ReactNode;
  /** Línea divisoria arriba (todas las filas menos la primera). */
  divider?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Fila de una lista dentro de una `Section`: se separan con líneas de 1 px, no con una tarjeta por fila. */
export function Row({ children, divider = false, onPress, accessibilityLabel, style }: RowProps) {
  const theme = useTheme();
  const base = [styles.row, divider && { borderTopWidth: 1, borderTopColor: theme.line }];
  if (!onPress) return <View style={[...base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed && { backgroundColor: theme.surfaceAlt }, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
