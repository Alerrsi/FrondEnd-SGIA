import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { MAX_CONTENT_WIDTH, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Tirar para recargar. */
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
}

/**
 * Marco de cada pestaña: canvas papel/grafito, borde de pantalla de 16 px y columna de hasta 640 px.
 * El área segura inferior la cubre el menú de iconos.
 */
export function Screen({ children, refreshing, onRefresh, keyboardShouldPersistTaps = 'handled' }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.inkMuted}
              colors={[theme.accent]}
              progressBackgroundColor={theme.surface}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
});
