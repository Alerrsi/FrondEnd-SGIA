import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { SelectOption } from '@/components/ui/select-field';
import { useTheme } from '@/hooks/use-theme';

interface MultiSelectFieldProps<T extends string | number> {
  /** Nombre del campo para lectores de pantalla. */
  accessibilityLabel: string;
  options: SelectOption<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  placeholder?: string;
}

function summary<T extends string | number>(
  options: SelectOption<T>[],
  values: T[],
  placeholder: string,
): string {
  if (values.length === 0) return placeholder;
  if (values.length > 1) return `${values.length} seleccionados`;
  return options.find((option) => option.value === values[0])?.label ?? placeholder;
}

/** Lista desplegable vertical de selección múltiple: sigue abierta al marcar cada opción. */
export function MultiSelectField<T extends string | number>({
  accessibilityLabel,
  options,
  values,
  onChange,
  placeholder = 'Selecciona una o más opciones',
}: MultiSelectFieldProps<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const text = summary(options, values, placeholder);

  const toggle = (value: T) => {
    onChange(
      values.includes(value)
        ? values.filter((current) => current !== value)
        : [...values, value],
    );
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={text}
        accessibilityState={{ expanded: open }}
        style={[
          styles.row,
          styles.trigger,
          { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
        ]}
      >
        <ThemedText
          style={styles.text}
          themeColor={values.length > 0 ? 'text' : 'textSecondary'}
          numberOfLines={1}
        >
          {text}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{open ? '▴' : '▾'}</ThemedText>
      </Pressable>

      {open && (
        <View
          style={[
            styles.list,
            { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
          ]}
        >
          {options.map((option, index) => {
            const isSelected = values.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => toggle(option.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                style={({ pressed }) => [
                  styles.row,
                  styles.option,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.backgroundSelected,
                  },
                  (isSelected || pressed) && { backgroundColor: theme.backgroundSelected },
                ]}
              >
                <ThemedText style={[styles.text, isSelected && styles.selectedText]}>
                  {option.label}
                </ThemedText>
                <ThemedText style={styles.selectedText}>{isSelected ? '☑' : '☐'}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  trigger: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  list: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
