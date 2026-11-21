import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing, TOUCH } from '@/theme';

/** Cabecera de una hoja (`Modal` con `pageSheet`): título y botón de cerrar de 44 px, con línea inferior. */
export function SheetHeader({
  title,
  onClose,
  closeLabel = 'Cerrar',
  disabled = false,
}: {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: theme.line, backgroundColor: theme.bg }]}>
      <ThemedText variant="section" accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </ThemedText>
      <Pressable
        onPress={onClose}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        style={({ pressed }) => [
          styles.close,
          pressed && { backgroundColor: theme.surfaceAlt },
          disabled && styles.disabled,
        ]}
      >
        <X size={18} color={theme.ink} aria-hidden />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  title: { flex: 1 },
  close: { width: TOUCH, height: TOUCH, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
});
