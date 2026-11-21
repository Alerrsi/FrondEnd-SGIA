import { ChevronRight, FileWarning } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Row } from '@/components/ui/row';
import { Section } from '@/components/ui/section';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

/** Informes de novedades sin cerrar; lleva a Novedades. */
export function OpenReports({ count, isLoading, isError }: { count: number | undefined; isLoading: boolean; isError: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const value = isLoading ? '…' : isError || count === undefined ? '—' : String(count);
  const description =
    count === undefined || isError
      ? 'Fallas y faltantes que reportaste.'
      : count === 0
        ? 'Ninguno pendiente: el pañol cerró todos.'
        : count === 1
          ? 'El pañol aún lo revisa o repara.'
          : 'El pañol aún los revisa o repara.';

  return (
    <Section flush>
      <Row onPress={() => router.navigate('/novedades')} accessibilityLabel={`Informes abiertos: ${value}`}>
        <FileWarning size={18} color={theme.inkMuted} aria-hidden />
        <View style={styles.text}>
          <ThemedText variant="bodyMedium">Informes abiertos</ThemedText>
          <ThemedText variant="secondary">{description}</ThemedText>
        </View>
        <ThemedText variant="metric" style={styles.count}>
          {value}
        </ThemedText>
        <ChevronRight size={16} color={theme.inkFaint} aria-hidden />
      </Row>
    </Section>
  );
}

const styles = StyleSheet.create({
  text: { flex: 1, gap: spacing.xxs },
  count: { fontSize: 20, lineHeight: 26 },
});
