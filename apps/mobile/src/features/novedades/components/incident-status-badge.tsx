import type { IncidentStatus } from '@sgia/types';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { INCIDENT_STATUS_META } from '@/features/novedades/lib/incident-status';

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const meta = INCIDENT_STATUS_META[status] ?? {
    label: status,
    background: '#f3f4f6',
    color: '#4b5563',
  };

  return (
    <View style={[styles.badge, { backgroundColor: meta.background }]}>
      <ThemedText style={[styles.text, { color: meta.color }]}>{meta.label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  text: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
});
