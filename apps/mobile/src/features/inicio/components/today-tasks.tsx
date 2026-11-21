import type { LucideIcon } from 'lucide-react-native';
import { CalendarX, Check, Clock, PackageCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { LoanSummary } from '@/features/inicio/lib/loan-summary';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

interface TaskCellProps {
  icon: LucideIcon;
  title: string;
  count: number | undefined;
  isLoading: boolean;
  divider: boolean;
  onPress: () => void;
}

/** Celda de «Lo que te toca hoy»: cifra con barra burdeo si hay pendientes; «Al día» si no. */
function TaskCell({ icon: Icon, title, count, isLoading, divider, onPress }: TaskCellProps) {
  const theme = useTheme();
  const pending = count !== undefined && count > 0;
  const status = isLoading ? 'cargando' : count === undefined ? 'sin datos' : pending ? String(count) : 'al día';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${status}`}
      accessibilityHint="Abre Mis préstamos"
      style={({ pressed }) => [
        styles.cell,
        divider && { borderLeftWidth: 1, borderLeftColor: theme.line },
        { backgroundColor: pressed ? theme.surfaceAlt : theme.surface },
      ]}
    >
      {pending && <View style={[styles.bar, { backgroundColor: theme.accent }]} />}
      <Icon size={16} color={theme.inkMuted} aria-hidden />
      {pending ? (
        <ThemedText variant="metric">{count}</ThemedText>
      ) : (
        <View style={styles.idle}>
          {count !== undefined && <Check size={14} color={theme.inkMuted} aria-hidden />}
          <ThemedText variant="secondary">{isLoading ? '…' : count === undefined ? '—' : 'Al día'}</ThemedText>
        </View>
      )}
      <ThemedText variant="label" tone="inkMuted">
        {title}
      </ThemedText>
    </Pressable>
  );
}

/** Estado de las solicitudes del docente en tres celdas que comparten bordes (`CellGrid` del web). */
export function TodayTasks({ summary, isLoading }: { summary: LoanSummary | undefined; isLoading: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const open = () => router.navigate('/explore');

  return (
    <View style={[styles.grid, { borderColor: theme.line }]}>
      <TaskCell icon={Clock} title="En revisión" count={summary?.inReview} isLoading={isLoading} divider={false} onPress={open} />
      <TaskCell icon={PackageCheck} title="Para retirar" count={summary?.readyToPickUp} isLoading={isLoading} divider onPress={open} />
      <TaskCell icon={CalendarX} title="Atrasadas" count={summary?.overdue} isLoading={isLoading} divider onPress={open} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  cell: { flex: 1, gap: spacing.sm, padding: spacing.md, minHeight: 112 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  idle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 30 },
});
