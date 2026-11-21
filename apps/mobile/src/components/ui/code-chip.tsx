import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

/** Etiqueta crema con tinta burdeo para identificadores (SKU, código de solicitud o informe). */
export function CodeChip({ code }: { code: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.tag }]}>
      <ThemedText variant="codeSmall" style={{ color: theme.tagInk }} numberOfLines={1}>
        {code}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
});
