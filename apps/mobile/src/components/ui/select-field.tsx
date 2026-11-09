import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string | number> {
  /** Nombre del campo para lectores de pantalla. */
  accessibilityLabel: string;
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
}

/** Lista desplegable vertical: se abre bajo el campo, sin scroll propio dentro del formulario. */
export function SelectField<T extends string | number>({
  accessibilityLabel,
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
}: SelectFieldProps<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={selected ? `Seleccionado: ${selected.label}` : placeholder}
        accessibilityState={{ expanded: open }}
        style={[
          styles.trigger,
          { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
        ]}
      >
        <ThemedText
          style={styles.triggerText}
          themeColor={selected ? 'text' : 'textSecondary'}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
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
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.option,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.backgroundSelected,
                  },
                  (isSelected || pressed) && { backgroundColor: theme.backgroundSelected },
                ]}
              >
                <ThemedText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </ThemedText>
                {isSelected && <ThemedText style={styles.optionTextSelected}>✓</ThemedText>}
              </Pressable>
            );
          })}
        </View>
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
  triggerText: {
    flex: 1,
    fontSize: 13,
  },
  list: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
  },
  optionTextSelected: {
    fontSize: 13,
    fontWeight: '700',
  },
});
