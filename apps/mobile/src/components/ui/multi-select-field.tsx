import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Check, ChevronDown } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { controlStyle, dropdownStyle } from '@/components/ui/control-style';
import type { SelectOption } from '@/components/ui/select-field';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing, TOUCH } from '@/theme';

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
        style={[controlStyle(theme, { focused: open }), styles.row]}
      >
        <ThemedText style={styles.text} tone={values.length > 0 ? 'ink' : 'inkFaint'} numberOfLines={1}>
          {text}
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
                  index > 0 && { borderTopWidth: 1, borderTopColor: theme.line },
                  pressed && { backgroundColor: theme.surfaceAlt },
                ]}
              >
                <ThemedText variant={isSelected ? 'bodyMedium' : 'body'} style={styles.text}>
                  {option.label}
                </ThemedText>
                <View
                  style={[
                    styles.box,
                    isSelected
                      ? { backgroundColor: theme.accent, borderColor: theme.accent }
                      : { borderColor: theme.lineStrong },
                  ]}
                >
                  {isSelected && <Check size={12} strokeWidth={3} color={theme.accentInk} aria-hidden />}
                </View>
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
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1 },
  box: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
