import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Check, ChevronDown } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { controlStyle, dropdownStyle } from '@/components/ui/control-style';
import { useTheme } from '@/hooks/use-theme';
import { spacing, TOUCH } from '@/theme';

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
        style={[controlStyle(theme, { focused: open }), styles.trigger]}
      >
        <ThemedText style={styles.text} tone={selected ? 'ink' : 'inkFaint'} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </ThemedText>
        <ChevronDown
          size={16}
          color={theme.inkMuted}
          style={open ? styles.chevronOpen : undefined}
          aria-hidden
        />
      </Pressable>

      {open && (
        <View style={dropdownStyle(theme)}>
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
                  index > 0 && { borderTopWidth: 1, borderTopColor: theme.line },
                  (isSelected || pressed) && { backgroundColor: theme.surfaceAlt },
                ]}
              >
                <ThemedText variant={isSelected ? 'bodyMedium' : 'body'} style={styles.text}>
                  {option.label}
                </ThemedText>
                {isSelected && <Check size={16} color={theme.accent} aria-hidden />}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  option: {
    minHeight: TOUCH,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  text: { flex: 1 },
});
