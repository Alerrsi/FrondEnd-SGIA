import { useMyIncidentReports } from '@sgia/api-client';
import type { IncidentReport } from '@sgia/types';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileWarning, Plus } from 'lucide-react-native';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { CodeChip } from '@/components/ui/code-chip';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StateMessage } from '@/components/ui/state-message';
import { IncidentDetail } from '@/features/novedades/components/incident-detail';
import { IncidentStatusBadge } from '@/features/novedades/components/incident-status-badge';
import { NewIncidentForm } from '@/features/novedades/components/new-incident-form';
import { useTheme } from '@/hooks/use-theme';
import { formatIsoDate } from '@/lib/dates';
import { MAX_CONTENT_WIDTH, radius, spacing } from '@/theme';

const PAGE_SIZE = 15;

export default function NovedadesScreen() {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  // «Reportar una falla» desde Inicio abre el formulario (`/novedades?nuevo=<marca>`); cada toque trae otra marca.
  const { nuevo } = useLocalSearchParams<{ nuevo?: string }>();
  const [lastNuevo, setLastNuevo] = useState<string | undefined>(undefined);
  if (nuevo !== lastNuevo) {
    setLastNuevo(nuevo);
    if (nuevo) setFormOpen(true);
  }
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
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: pressed ? theme.surfaceAlt : theme.surface, borderColor: theme.line },
        ]}
      >
        <View style={styles.cardHeader}>
          <CodeChip code={item.code ?? `#${item.id}`} />
          <IncidentStatusBadge status={item.status} />
        </View>
        <ThemedText variant="bodyMedium">{item.subject ?? item.title ?? '—'}</ThemedText>
        <View style={styles.metaRow}>
          <ThemedText variant="secondary" style={styles.meta}>
            {formatIsoDate(date.slice(0, 10))} · {item.location?.nombre ?? 'Sin ubicación'} ·{' '}
            {count === 1 ? '1 problema' : `${count} problemas`}
          </ThemedText>
          <ChevronRight size={16} color={theme.inkFaint} aria-hidden />
        </View>
      </Pressable>
    );
  };

  const reports = data?.data ?? [];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <FlatList
        data={isLoading || isError ? [] : reports}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title="Novedades" description="Fallas y faltantes que has reportado." />
            <Button
              title="Nuevo informe"
              onPress={() => setFormOpen(true)}
              icon={(color) => <Plus size={16} color={color} aria-hidden />}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={theme.inkMuted}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <StateMessage kind="loading" />
          ) : isError ? (
            <StateMessage
              kind="error"
              title="No se pudieron cargar tus informes."
              actionLabel="Reintentar"
              onAction={() => void refetch()}
            />
          ) : (
            <StateMessage
              kind="empty"
              icon={<FileWarning size={24} color={theme.inkMuted} aria-hidden />}
              title="Sin informes"
              description="Cuando reportes una falla o un faltante aparecerá aquí."
            />
          )
        }
        ListFooterComponent={
          meta && meta.lastPage > 1 ? (
            <View style={styles.pagination}>
              <Button
                title="Anterior"
                variant="secondary"
                size="sm"
                onPress={() => setPage((current) => current - 1)}
                disabled={page <= 1}
                icon={(color) => <ChevronLeft size={16} color={color} aria-hidden />}
              />
              <ThemedText variant="secondary" style={styles.pageInfo}>
                {meta.currentPage} / {meta.lastPage}
              </ThemedText>
              <Button
                title="Siguiente"
                variant="secondary"
                size="sm"
                onPress={() => setPage((current) => current + 1)}
                disabled={page >= meta.lastPage}
              />
            </View>
          ) : undefined
        }
      />

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
  header: { gap: spacing.lg, paddingBottom: spacing.xs },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { flex: 1, fontVariant: ['tabular-nums'] },
  pageInfo: { flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
