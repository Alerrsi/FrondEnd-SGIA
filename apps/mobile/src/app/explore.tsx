import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelLoanRequest, fetchMyLoanRequests } from '@sgia/api-client';
import { LoanStatus, type Prestamo } from '@sgia/types';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function MisSolicitudesScreen() {
  const theme = useTheme();
  const [requests, setRequests] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    loadRequests().finally(() => setLoading(false));
  }, [loadRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleCancelRequest = (loan: Prestamo) => {
    Alert.alert(
      'Cancelar Solicitud',
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

  const getStatusBadgeStyle = (estado: string) => {
    switch (estado) {
      case LoanStatus.PENDIENTE:
      case LoanStatus.EN_PROCESO:
        return {
          bg: '#fef3c7',
          text: '#b45309',
          label: 'Pendiente en Pañol',
        };
      case LoanStatus.PREPARADO:
        return {
          bg: '#dbeafe',
          text: '#1d4ed8',
          label: 'Insumos Preparados',
        };
      case LoanStatus.ENTREGADO:
      case LoanStatus.ACTIVO:
        return {
          bg: '#d1fae5',
          text: '#047857',
          label: 'Entregado / En Uso',
        };
      case LoanStatus.DEVUELTO:
      case LoanStatus.PROCESADA:
        return {
          bg: '#f3f4f6',
          text: '#4b5563',
          label: 'Devuelto Conforme',
        };
      case LoanStatus.RECHAZADA:
        return {
          bg: '#fee2e2',
          text: '#b91c1c',
          label: 'Rechazado por Pañol',
        };
      default:
        return {
          bg: '#f3f4f6',
          text: '#6b7280',
          label: estado,
        };
    }
  };

  const renderItem = ({ item }: { item: Prestamo }) => {
    const badge = getStatusBadgeStyle(item.estado);
    const isPending =
      item.estado === LoanStatus.PENDIENTE || item.estado === LoanStatus.EN_PROCESO;
    const isCanceling = cancelingId === item.id;

    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        {/* Cabecera de la tarjeta */}
        <View style={styles.cardHeader}>
          <View>
            <ThemedText type="code" style={styles.loanCode}>
              {item.codigo ?? `#${item.id}`}
            </ThemedText>
            <ThemedText style={styles.loanDate} themeColor="textSecondary">
              {item.fechaSolicitada || item.loan_date || 'Fecha actual'}{' '}
              {item.time_block ? `· ${item.time_block}` : ''}
            </ThemedText>
          </View>

          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <ThemedText style={[styles.badgeText, { color: badge.text }]}>
              {badge.label}
            </ThemedText>
          </View>
        </View>

        {/* Datos de Asignatura y Sala */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <ThemedText type="code" style={styles.metaLabel}>
              ASIGNATURA:
            </ThemedText>
            <ThemedText style={styles.metaValue}>
              {item.asignatura || item.subject || 'Sin especificar'}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <ThemedText type="code" style={styles.metaLabel}>
              LUGAR:
            </ThemedText>
            <ThemedText style={styles.metaValue}>
              {item.sala || item.room || 'Taller general'}
            </ThemedText>
          </View>
        </View>

        {/* Desglose de Ítems */}
        <View style={styles.itemsSection}>
          <ThemedText type="code" style={styles.itemsTitle}>
            ÍTEMS ({item.items.reduce((acc, it) => acc + it.cantidad, 0)}):
          </ThemedText>
          {item.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <ThemedText style={styles.itemName} numberOfLines={1}>
                • {it.nombre || `Producto #${it.productoId}`}
              </ThemedText>
              <ThemedText type="code" style={styles.itemQty}>
                {it.cantidad} un.
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Motivo de Rechazo en caso de rechazada */}
        {(item.motivoRechazo || item.rejection_reason) && (
          <View style={styles.rejectionBox}>
            <ThemedText type="smallBold" style={styles.rejectionTitle}>
              Motivo de rechazo indicado por pañol:
            </ThemedText>
            <ThemedText style={styles.rejectionReason}>
              {item.motivoRechazo || item.rejection_reason}
            </ThemedText>
          </View>
        )}

        {/* Botón de Cancelar si está en estado pendiente */}
        {isPending && (
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleCancelRequest(item)}
              disabled={isCanceling}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && { opacity: 0.7 },
                isCanceling && { opacity: 0.5 },
              ]}
            >
              {isCanceling ? (
                <ActivityIndicator size="small" color="#b91c1c" />
              ) : (
                <ThemedText style={styles.cancelButtonText}>
                  Cancelar Solicitud
                </ThemedText>
              )}
            </Pressable>
          </View>
        )}
      </ThemedView>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Mis Solicitudes
        </ThemedText>
        <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
          Seguimiento en tiempo real de tus préstamos remotos y solicitudes a pañol.
        </ThemedText>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#d9232a" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: BottomTabInset + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d9232a"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Sin solicitudes
              </ThemedText>
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                Aún no has solicitado insumos o equipos. Puedes crear una nueva solicitud en la
                pestaña "Solicitud".
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  loanDate: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 4,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    color: '#888',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  itemsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    paddingTop: 6,
    gap: 2,
  },
  itemsTitle: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    flex: 1,
    paddingRight: 8,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '600',
  },
  rejectionBox: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    gap: 2,
  },
  rejectionTitle: {
    fontSize: 11,
    color: '#991b1b',
  },
  rejectionReason: {
    fontSize: 11,
    color: '#7f1d1d',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 11,
    color: '#b91c1c',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
