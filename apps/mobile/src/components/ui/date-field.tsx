import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
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
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={`Fecha seleccionada: ${formatIsoDate(value)}`}
        accessibilityState={{ expanded: open }}
        style={[
          styles.trigger,
          { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
        ]}
      >
        <ThemedText style={styles.text}>{formatIsoDate(value)}</ThemedText>
        <ThemedText themeColor="textSecondary">📅</ThemedText>
      </Pressable>

      {open && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
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
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  text: {
    fontSize: 13,
  },
});
