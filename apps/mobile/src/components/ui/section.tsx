import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

interface SectionProps {
  title?: string;
  description?: string;
  /** Acción a la derecha del título (enlace o botón pequeño). */
  action?: ReactNode;
  /** Sin relleno interno: para listas de `Row` que llegan al borde. */
  flush?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Panel en superficie con borde de 1 px y radio 8, sin sombra (la «celda» del web). */
export function Section({ title, description, action, flush = false, children, style }: SectionProps) {
  const theme = useTheme();
  const hasHead = Boolean(title || action);
  return (
    <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.line }, style]}>
      {hasHead && (
        <View style={[styles.head, flush && styles.padded]}>
          <View style={styles.headText}>
            {title && (
              <ThemedText variant="section" accessibilityRole="header">
                {title}
              </ThemedText>
            )}
            {description && <ThemedText variant="secondary">{description}</ThemedText>}
          </View>
          {action}
        </View>
      )}
      <View style={[styles.body, !flush && styles.padded, flush && hasHead && styles.flushBody]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headText: { flex: 1, gap: spacing.xxs },
  padded: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  body: { gap: spacing.md, paddingTop: spacing.md },
  flushBody: { paddingTop: spacing.sm },
});
