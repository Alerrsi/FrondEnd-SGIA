import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing, TOUCH, type ThemeColor } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  /** `primary` es el único relleno (burdeo; rosa en oscuro): una acción principal por pantalla. */
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  disabled?: boolean;
  loading?: boolean;
  /** Icono a la izquierda del texto (recibe el color del texto). */
  icon?: (color: string) => ReactNode;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const FILL: Record<ButtonVariant, { bg: ThemeColor | 'transparent'; fg: ThemeColor; border: ThemeColor | 'transparent' }> = {
  primary: { bg: 'accent', fg: 'accentInk', border: 'transparent' },
  secondary: { bg: 'surface', fg: 'ink', border: 'line' },
  ghost: { bg: 'transparent', fg: 'ink', border: 'transparent' },
  danger: { bg: 'danger', fg: 'surface', border: 'transparent' },
};

/** Botón en pastilla de 44 px, como el `Button` del web. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  accessibilityHint,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const fill = FILL[variant];
  const fg = theme[fill.fg];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        {
          backgroundColor: fill.bg === 'transparent' ? 'transparent' : theme[fill.bg],
          borderColor: fill.border === 'transparent' ? 'transparent' : theme[fill.border],
          opacity: disabled ? 0.5 : 1,
        },
        pressed && !inactive && (variant === 'ghost' || variant === 'secondary'
          ? { backgroundColor: theme.surfaceAlt }
          : { opacity: 0.85 }),
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon?.(fg)}
          <ThemedText variant="bodyMedium" style={[{ color: fg }, size === 'sm' && styles.smText]} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { paddingHorizontal: spacing.md },
  smText: { fontSize: 13 },
  // Se hunde 1 px al pulsar (`ui-press` del web).
  pressed: { transform: [{ translateY: 1 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
