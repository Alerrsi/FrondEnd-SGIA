import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme';

/** Título único de la pantalla (h1) con bajada obligatoria y acción opcional, como `PageHeader` del web. */
export function ScreenHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.text}>
        <ThemedText variant="title" accessibilityRole="header">
          {title}
        </ThemedText>
        <ThemedText variant="subtitle">{description}</ThemedText>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  text: { flex: 1, gap: spacing.xs },
});
