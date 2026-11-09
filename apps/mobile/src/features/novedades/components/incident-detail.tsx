import { useIncidentReport } from '@sgia/api-client';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { IncidentStatusBadge } from '@/features/novedades/components/incident-status-badge';
import { useTheme } from '@/hooks/use-theme';
import { formatIsoDate } from '@/lib/dates';

interface IncidentDetailProps {
  reportId: number;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="code" style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </View>
  );
}

/** Detalle de solo lectura de un informe propio. */
export function IncidentDetail({ reportId, onClose }: IncidentDetailProps) {
  const theme = useTheme();
  const { data: report, isLoading, isError, refetch } = useIncidentReport(reportId);
  const date = report?.report_date ?? report?.created_at;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          {report?.code ?? 'Informe'}
        </ThemedText>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
          <ThemedText type="small" themeColor="textSecondary">
            Cerrar
          </ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : isError || !report ? (
        <Pressable onPress={() => void refetch()} accessibilityRole="button" style={styles.message}>
          <ThemedText type="small" themeColor="textSecondary">
            No se pudo cargar el informe. Toca para reintentar.
          </ThemedText>
        </Pressable>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusRow}>
            <IncidentStatusBadge status={report.status} />
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <Row label="ASIGNATURA" value={report.subject ?? report.title ?? '—'} />
            <Row label="FECHA" value={date ? formatIsoDate(date.slice(0, 10)) : '—'} />
            <Row label="LABORATORIO" value={report.location?.nombre ?? '—'} />
            {report.equipment_unit && (
              <Row label="EQUIPO" value={report.equipment_unit.code} />
            )}
            <Row label="FOTO" value={report.has_evidence_photo ? 'Adjunta' : 'Sin foto'} />
            <Row label="FIRMA" value={report.has_signature ? 'Registrada' : 'Sin firma'} />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="code" style={styles.label}>
              PROBLEMAS
            </ThemedText>
            {(report.problems ?? []).length === 0 ? (
              <ThemedText style={styles.value}>{report.description ?? '—'}</ThemedText>
            ) : (
              report.problems?.map((problem) => (
                <View key={problem.type} style={styles.problem}>
                  <ThemedText type="smallBold">{problem.label ?? problem.type}</ThemedText>
                  <ThemedText style={styles.value}>{problem.description}</ThemedText>
                </View>
              ))
            )}
          </ThemedView>

          {report.suggestion && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <Row label="SUGERENCIA" value={report.suggestion} />
            </ThemedView>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  loader: {
    marginTop: 40,
  },
  message: {
    padding: Spacing.four,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  row: {
    gap: 2,
  },
  label: {
    fontSize: 10,
    color: '#888',
  },
  value: {
    fontSize: 13,
    lineHeight: 18,
  },
  problem: {
    gap: 2,
  },
});
