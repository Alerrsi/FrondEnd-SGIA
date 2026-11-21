import { useIncidentReport } from '@sgia/api-client';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CodeChip } from '@/components/ui/code-chip';
import { Row } from '@/components/ui/row';
import { Section } from '@/components/ui/section';
import { SheetHeader } from '@/components/ui/sheet-header';
import { StateMessage } from '@/components/ui/state-message';
import { IncidentStatusBadge } from '@/features/novedades/components/incident-status-badge';
import { useTheme } from '@/hooks/use-theme';
import { formatIsoDate } from '@/lib/dates';
import { MAX_CONTENT_WIDTH, spacing } from '@/theme';

interface IncidentDetailProps {
  reportId: number;
  onClose: () => void;
}

/** Dato de la ficha: rótulo a la izquierda y valor a la derecha, con línea entre filas. */
function DataRow({ label, value, divider, code = false }: { label: string; value: string; divider: boolean; code?: boolean }) {
  return (
    <Row divider={divider} style={styles.dataRow}>
      <ThemedText variant="secondary" style={styles.dataLabel}>
        {label}
      </ThemedText>
      <View style={styles.dataValue}>
        {code ? <CodeChip code={value} /> : <ThemedText variant="body">{value}</ThemedText>}
      </View>
    </Row>
  );
}

/** Detalle de solo lectura de un informe propio. */
export function IncidentDetail({ reportId, onClose }: IncidentDetailProps) {
  const theme = useTheme();
  const { data: report, isLoading, isError, refetch } = useIncidentReport(reportId);
  const date = report?.report_date ?? report?.created_at;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <SheetHeader title="Informe de novedades" onClose={onClose} />

      {isLoading ? (
        <StateMessage kind="loading" />
      ) : isError || !report ? (
        <StateMessage
          kind="error"
          title="No se pudo cargar el informe."
          actionLabel="Reintentar"
          onAction={() => void refetch()}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.top}>
            <CodeChip code={report.code ?? `#${report.id}`} />
            <IncidentStatusBadge status={report.status} />
          </View>

          <Section flush>
            <DataRow divider={false} label="Asignatura" value={report.subject ?? report.title ?? '—'} />
            <DataRow divider label="Fecha" value={date ? formatIsoDate(date.slice(0, 10)) : '—'} />
            <DataRow divider label="Laboratorio o pañol" value={report.location?.nombre ?? '—'} />
            {report.equipment_unit && (
              <DataRow divider label="Equipo" value={report.equipment_unit.code} code />
            )}
            <DataRow divider label="Foto" value={report.has_evidence_photo ? 'Adjunta' : 'Sin foto'} />
            <DataRow divider label="Firma" value={report.has_signature ? 'Registrada' : 'Sin firma'} />
          </Section>

          <Section title="Problemas">
            {(report.problems ?? []).length === 0 ? (
              <ThemedText variant="body">{report.description ?? '—'}</ThemedText>
            ) : (
              report.problems?.map((problem) => (
                <View key={problem.type} style={styles.problem}>
                  <ThemedText variant="bodyMedium">{problem.label ?? problem.type}</ThemedText>
                  <ThemedText variant="secondary">{problem.description}</ThemedText>
                </View>
              ))
            )}
          </Section>

          {report.suggestion && (
            <Section title="Sugerencia">
              <ThemedText variant="body">{report.suggestion}</ThemedText>
            </Section>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  dataRow: { alignItems: 'baseline' },
  dataLabel: { width: 120 },
  dataValue: { flex: 1 },
  problem: { gap: spacing.xxs },
});
