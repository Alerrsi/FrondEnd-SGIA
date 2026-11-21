import type { ViewStyle } from 'react-native';

import type { ThemePalette } from '@/theme';
import { radius, spacing, TOUCH } from '@/theme';

/**
 * Estilo único de los campos (equivale a `FORM_CONTROL_CLASS` del web): superficie, borde de 1 px,
 * radio 6, 44 px de alto. Con foco el borde pasa a burdeo; con error, a `danger`.
 */
export function controlStyle(
  theme: ThemePalette,
  state: { focused?: boolean; invalid?: boolean } = {},
): ViewStyle {
  return {
    minHeight: TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    backgroundColor: theme.surface,
    borderColor: state.invalid ? theme.danger : state.focused ? theme.accent : theme.line,
  };
}

/** Panel desplegable bajo un campo (opciones de un select). */
export function dropdownStyle(theme: ThemePalette): ViewStyle {
  return {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderColor: theme.line,
    backgroundColor: theme.surface,
  };
}
