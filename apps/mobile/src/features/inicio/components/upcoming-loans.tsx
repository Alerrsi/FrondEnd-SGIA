import type { Prestamo } from '@sgia/types';
import { CalendarClock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Row } from '@/components/ui/row';
import { Section } from '@/components/ui/section';
import { StateMessage } from '@/components/ui/state-message';
import { loanDay } from '@/features/inicio/lib/loan-summary';
import { loanStatusMeta } from '@/features/prestamos/lib/loan-status';
import { useTheme } from '@/hooks/use-theme';
import { parseIsoDate } from '@/lib/dates';
import { radius, spacing } from '@/theme';

const monthFormat = new Intl.DateTimeFormat('es-CL', { month: 'short' });

function schedule(loan: Prestamo): string {
  if (loan.start_time && loan.end_time) return `${loan.start_time.slice(0, 5)} – ${loan.end_time.slice(0, 5)}`;
  return loan.time_block ?? loan.bloqueHorario ?? 'Sin horario';
}

/** Fecha en bloque de calendario: día grande y mes abreviado. */
function DayChip({ iso }: { iso: string }) {
  const theme = useTheme();
  const date = parseIsoDate(iso);
  return (
    <View style={[styles.day, { borderColor: theme.line, backgroundColor: theme.surfaceAlt }]}>
      <ThemedText variant="section" style={styles.tabular}>
        {date.getDate()}
      </ThemedText>
      <ThemedText variant="caption" tone="inkMuted">
        {monthFormat.format(date).replace('.', '')}
      </ThemedText>
    </View>
  );
}

interface UpcomingLoansProps {
  loans: Prestamo[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/** Próximas clases con préstamo: hasta tres, de la más cercana a la más lejana. */
export function UpcomingLoans({ loans, isLoading, isError, onRetry }: UpcomingLoansProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Section
      title="Próximas clases"
      flush
      action={<Button title="Ver todas" variant="ghost" size="sm" onPress={() => router.navigate('/explore')} />}
    >
      {isLoading ? (
        <StateMessage kind="loading" />
      ) : isError ? (
        <StateMessage kind="error" title="No se pudieron cargar tus solicitudes." actionLabel="Reintentar" onAction={onRetry} />
      ) : loans.length === 0 ? (
        <StateMessage
          kind="empty"
          icon={<CalendarClock size={24} color={theme.inkMuted} aria-hidden />}
          title="Sin clases agendadas"
          description="Pide el material de tu próxima clase con anticipación."
          actionLabel="Solicitar equipo"
          onAction={() => router.navigate('/solicitar')}
        />
      ) : (
        loans.map((loan, index) => {
          const status = loanStatusMeta(loan);
          const day = loanDay(loan);
          const place = loan.location?.nombre ?? loan.sala ?? loan.room;
          return (
            <Row
              key={loan.id}
              divider={index > 0}
              onPress={() => router.navigate('/explore')}
              accessibilityLabel={`${loan.asignatura ?? loan.subject ?? 'Clase'}, ${day ?? ''}, ${status.label}`}
            >
              {day && <DayChip iso={day} />}
              <View style={styles.text}>
                <ThemedText variant="bodyMedium" numberOfLines={1}>
                  {loan.asignatura ?? loan.subject ?? 'Sin asignatura'}
                </ThemedText>
                <ThemedText variant="secondary" numberOfLines={1} style={styles.tabular}>
                  {schedule(loan)}
                  {place ? ` · ${place}` : ''}
                </ThemedText>
                <Badge tone={status.tone} label={status.label} dot />
              </View>
            </Row>
          );
        })
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  day: {
    width: 48,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  text: { flex: 1, gap: spacing.xs },
  tabular: { fontVariant: ['tabular-nums'] },
});
