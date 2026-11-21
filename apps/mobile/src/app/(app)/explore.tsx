import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, LogOut } from 'lucide-react-native';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelLoanRequest, fetchMyLoanRequests } from '@sgia/api-client';
import { LoanStatus, type Prestamo } from '@sgia/types';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodeChip } from '@/components/ui/code-chip';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StateMessage } from '@/components/ui/state-message';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { MAX_CONTENT_WIDTH, radius, spacing, type Tone } from '@/theme';

/** Estado de la solicitud con el tono y el nombre del web (`LoanStatusBadge`), siempre con texto. */
function loanStatusMeta(estado: string): { tone: Tone; label: string } {
  switch (String(estado).toLowerCase()) {
    case 'pendiente':
    case 'en_proceso':
      return { tone: 'warn', label: 'Pendiente en pañol' };
    case 'preparado':
      return { tone: 'accent', label: 'Insumos preparados' };
    case 'entregado':
    case 'activo':
      return { tone: 'info', label: 'En préstamo' };
    case 'devuelto':
    case 'procesada':
    case 'procesado':
    case 'finalizado':
      return { tone: 'ok', label: 'Devuelto' };
    case 'atrasado':
      return { tone: 'danger', label: 'Atrasado' };
    case 'rechazada':
    case 'rechazado':
    case 'cancelado':
      return { tone: 'danger', label: 'Rechazado' };
    default:
      return { tone: 'neutral', label: estado };
  }
}

export default function MisSolicitudesScreen() {
  const theme = useTheme();
  const { logout } = useAuth();
  const [requests, setRequests] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await fetchMyLoanRequests();
      setRequests(data);
    } catch {
      // Error silencioso en carga secundaria
    }
  }, []);

  useEffect(() => {
    fetchMyLoanRequests()
      .then(setRequests)
      .catch(() => {
        // Error silencioso en carga secundaria
      })
      .finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleCancelRequest = (loan: Prestamo) => {
    Alert.alert(
      'Cancelar solicitud',
      `¿Estás seguro de cancelar la solicitud #${loan.codigo ?? loan.id}?`,
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelingId(loan.id);
              await cancelLoanRequest(loan.id);
              Alert.alert('Cancelada', 'La solicitud ha sido cancelada con éxito.');
              await loadRequests();
            } catch {
              Alert.alert('Error', 'No se pudo cancelar la solicitud.');
            } finally {
              setCancelingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Prestamo }) => {
    const status = loanStatusMeta(item.estado);
    const isPending = item.estado === LoanStatus.PENDIENTE; // la API solo cancela en pendiente
    const isCanceling = cancelingId === item.id;
    const total = item.items.reduce((acc, it) => acc + it.cantidad, 0);
    const rejection = item.motivoRechazo || item.rejection_reason;

    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headText}>
            <CodeChip code={item.codigo ?? `#${item.id}`} />
            <ThemedText variant="secondary" style={styles.tabular}>
              {item.fechaSolicitada || item.loan_date || 'Fecha actual'}
              {item.time_block ? ` · ${item.time_block}` : ''}
            </ThemedText>
          </View>
          <Badge tone={status.tone} label={status.label} dot />
        </View>

        <View style={[styles.meta, { borderTopColor: theme.line }]}>
          <View style={styles.metaItem}>
            <ThemedText variant="label" tone="inkMuted">
              Asignatura
            </ThemedText>
            <ThemedText variant="body">{item.asignatura || item.subject || 'Sin especificar'}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <ThemedText variant="label" tone="inkMuted">
              Lugar
            </ThemedText>
            <ThemedText variant="body">{item.sala || item.room || 'Taller general'}</ThemedText>
          </View>
        </View>

        <View style={[styles.items, { borderTopColor: theme.line }]}>
          <ThemedText variant="label" tone="inkMuted">
            Ítems ({total})
          </ThemedText>
          {item.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <ThemedText variant="body" style={styles.itemName} numberOfLines={1}>
                {it.nombre || `Producto #${it.productoId}`}
              </ThemedText>
              <ThemedText variant="secondary" style={styles.tabular}>
                {it.cantidad} un.
              </ThemedText>
            </View>
          ))}
        </View>

        {rejection && (
          <View style={[styles.rejection, { backgroundColor: theme.dangerBg }]}>
            <ThemedText variant="label" tone="danger">
              Motivo de rechazo
            </ThemedText>
            <ThemedText variant="secondary" tone="danger">
              {rejection}
            </ThemedText>
          </View>
        )}

        {isPending && (
          <Button
            title="Cancelar solicitud"
            variant="secondary"
            size="sm"
            onPress={() => handleCancelRequest(item)}
            loading={isCanceling}
            style={styles.cancel}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <FlatList
        data={loading ? [] : requests}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ScreenHeader
            title="Mis préstamos"
            description="Estado de tus solicitudes al pañol."
            action={
              <Button
                title="Salir"
                variant="ghost"
                size="sm"
                onPress={() => void logout()}
                accessibilityHint="Cierra la sesión"
                icon={(color) => <LogOut size={16} color={color} aria-hidden />}
              />
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.inkMuted}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
        ListEmptyComponent={
          loading ? (
            <StateMessage kind="loading" />
          ) : (
            <StateMessage
              kind="empty"
              icon={<CalendarClock size={24} color={theme.inkMuted} aria-hidden />}
              title="Sin solicitudes"
              description="Aún no pides equipos. Crea una solicitud en «Solicitar equipo»."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  headText: { flex: 1, gap: spacing.xs },
  tabular: { fontVariant: ['tabular-nums'] },
  meta: { flexDirection: 'row', gap: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  metaItem: { flex: 1, gap: spacing.xxs },
  items: { gap: spacing.xs, paddingTop: spacing.md, borderTopWidth: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  itemName: { flex: 1 },
  rejection: { borderRadius: radius.md, padding: spacing.md, gap: spacing.xxs },
  cancel: { alignSelf: 'flex-end' },
});
