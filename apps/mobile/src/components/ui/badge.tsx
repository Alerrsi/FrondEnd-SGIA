import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing, toneColors, type Tone } from '@/theme';

/** Estado con texto y tono (`ok`, `info`, `warn`, `danger`, `accent`, `neutral`), como el `Badge` del web. */
export function Badge({ tone = 'neutral', label, dot = false }: { tone?: Tone; label: string; dot?: boolean }) {
  const theme = useTheme();
  const { fg, bg } = toneColors(theme, tone);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: fg }]} />}
      <ThemedText variant="caption" style={{ color: fg }} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  dot: { width: 6, height: 6, borderRadius: radius.full },
});
