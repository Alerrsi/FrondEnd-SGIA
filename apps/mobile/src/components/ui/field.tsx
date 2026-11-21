import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Etiqueta de 13 px, control, ayuda y error en `danger` (como `FIELD_LABEL_CLASS` del web). */
export function Field({ label, required = false, hint, error, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText variant="label" tone="inkMuted">
        {label}
        {required ? ' *' : ''}
      </ThemedText>
      {children}
      {error ? (
        <ThemedText variant="secondary" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText variant="secondary">{hint}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs + 2 },
});
