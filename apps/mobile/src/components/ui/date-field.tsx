import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { CalendarDays } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { controlStyle } from '@/components/ui/control-style';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import { formatIsoDate, parseIsoDate, toIsoDate } from '@/lib/dates';

interface DateFieldProps {
  /** Nombre del campo para lectores de pantalla. */
  accessibilityLabel: string;
  /** Fecha en `AAAA-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  /** Fecha mínima en `AAAA-MM-DD`. */
  minimumDate?: string;
  /** Fecha máxima en `AAAA-MM-DD`. */
  maximumDate?: string;
}

/** Campo de fecha con el selector nativo: calendario en línea en iOS y diálogo en Android. */
export function DateField({
  accessibilityLabel,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const theme = useTheme();
  const scheme = useThemeName();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={`Fecha seleccionada: ${formatIsoDate(value)}`}
        accessibilityState={{ expanded: open }}
        style={[controlStyle(theme, { focused: open }), styles.trigger]}
      >
        <ThemedText variant="body" style={styles.mono}>
          {formatIsoDate(value)}
        </ThemedText>
        <CalendarDays size={16} color={theme.inkMuted} aria-hidden />
      </Pressable>

      {open && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          accentColor={theme.accent}
          themeVariant={scheme}
          value={parseIsoDate(value)}
          minimumDate={minimumDate ? parseIsoDate(minimumDate) : undefined}
          maximumDate={maximumDate ? parseIsoDate(maximumDate) : undefined}
          onValueChange={(_event, date) => {
            setOpen(false);
            onChange(toIsoDate(date));
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  // Fecha con cifras tabulares (`font-mono` del web).
  mono: { fontVariant: ['tabular-nums'] },
});
