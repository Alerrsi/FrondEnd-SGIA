import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

interface StateMessageProps {
  kind: 'loading' | 'empty' | 'error';
  title?: string;
  description?: string;
  /** Reintentar (error) u otra acción (vacío). */
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

/** Carga, vacío y error con el mismo marco (`EmptyState` / `ErrorState` del web). */
export function StateMessage({ kind, title, description, actionLabel, onAction, icon }: StateMessageProps) {
  const theme = useTheme();
  return (
    <View style={styles.box} accessibilityLiveRegion={kind === 'error' ? 'polite' : 'none'}>
      {kind === 'loading' ? <ActivityIndicator color={theme.inkMuted} /> : icon}
      {title && (
        <ThemedText variant="bodyMedium" tone={kind === 'error' ? 'danger' : 'ink'} style={styles.center}>
          {title}
        </ThemedText>
      )}
      {description && (
        <ThemedText variant="secondary" style={styles.center}>
          {description}
        </ThemedText>
      )}
      {actionLabel && onAction && <Button title={actionLabel} variant="secondary" size="sm" onPress={onAction} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  center: { textAlign: 'center' },
});
