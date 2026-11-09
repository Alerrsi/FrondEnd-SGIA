import { useMyIncidentReports } from '@sgia/api-client';
import type { IncidentReport } from '@sgia/types';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { IncidentDetail } from '@/features/novedades/components/incident-detail';
import { IncidentStatusBadge } from '@/features/novedades/components/incident-status-badge';
import { NewIncidentForm } from '@/features/novedades/components/new-incident-form';
import { useTheme } from '@/hooks/use-theme';
import { formatIsoDate } from '@/lib/dates';

const PAGE_SIZE = 15;

export default function NovedadesScreen() {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, isLoading, isError, isRefetching, refetch } = useMyIncidentReports({
    page,
    per_page: PAGE_SIZE,
  });
  const meta = data?.meta;

  const renderItem = ({ item }: { item: IncidentReport }) => {
    const date = item.report_date ?? item.created_at;
    const count = item.problems?.length ?? 0;

    return (
      <Pressable
        onPress={() => setOpenId(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Ver informe ${item.code ?? item.id}`}
      >
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText type="code" style={styles.code}>
              {item.code ?? `#${item.id}`}
            </ThemedText>
            <IncidentStatusBadge status={item.status} />
          </View>
          <ThemedText style={styles.subject}>{item.subject ?? item.title ?? '—'}</ThemedText>
          <ThemedText style={styles.meta} themeColor="textSecondary">
            {formatIsoDate(date.slice(0, 10))} · {item.location?.nombre ?? 'Sin ubicación'} ·{' '}
            {count === 1 ? '1 problema' : `${count} problemas`}
          </ThemedText>
        </ThemedView>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Novedades
        </ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Informes de fallas y faltantes que has reportado.
        </ThemedText>
        <Pressable
          onPress={() => setFormOpen(true)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.newButton,
            { backgroundColor: theme.text },
            pressed && styles.pressed,
          ]}
        >
          <ThemedText style={[styles.newButtonText, { color: theme.background }]}>
            Nuevo informe
          </ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : isError ? (
        <Pressable onPress={() => void refetch()} accessibilityRole="button" style={styles.empty}>
          <ThemedText style={styles.emptyText} themeColor="textSecondary">
            No se pudieron cargar tus informes. Toca para reintentar.
          </ThemedText>
        </Pressable>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset + 40 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                Aún no has enviado informes.
              </ThemedText>
            </View>
          }
          ListFooterComponent={
            meta && meta.lastPage > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  onPress={() => setPage((current) => current - 1)}
                  disabled={page <= 1}
                  accessibilityRole="button"
                  style={[styles.pageButton, page <= 1 && styles.disabled]}
                >
                  <ThemedText type="small">Anterior</ThemedText>
                </Pressable>
                <ThemedText type="small" themeColor="textSecondary">
                  {meta.currentPage} / {meta.lastPage}
                </ThemedText>
                <Pressable
                  onPress={() => setPage((current) => current + 1)}
                  disabled={page >= meta.lastPage}
                  accessibilityRole="button"
                  style={[styles.pageButton, page >= meta.lastPage && styles.disabled]}
                >
                  <ThemedText type="small">Siguiente</ThemedText>
                </Pressable>
              </View>
            ) : undefined
          }
        />
      )}

      <Modal
        visible={formOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFormOpen(false)}
      >
        <NewIncidentForm onClose={() => setFormOpen(false)} />
      </Modal>

      <Modal
        visible={openId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpenId(null)}
      >
        {openId !== null && <IncidentDetail reportId={openId} onClose={() => setOpenId(null)} />}
      </Modal>
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
    paddingBottom: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  newButton: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  newButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  code: {
    fontSize: 14,
    fontWeight: '700',
  },
  subject: {
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    fontSize: 11,
    lineHeight: 16,
  },
  empty: {
    paddingTop: 60,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pageButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  disabled: {
    opacity: 0.4,
  },
});
