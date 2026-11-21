import { useState } from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

import { controlStyle } from '@/components/ui/control-style';
import { useTheme } from '@/hooks/use-theme';
import { spacing, type } from '@/theme';

export type TextFieldProps = TextInputProps & { invalid?: boolean };

/** Campo de texto de 44 px con borde burdeo al enfocar. */
export function TextField({ invalid = false, multiline, style, onFocus, onBlur, ...props }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={theme.inkFaint}
      selectionColor={theme.accent}
      cursorColor={theme.accent}
      multiline={multiline}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        controlStyle(theme, { focused, invalid }),
        type.body,
        { color: theme.ink },
        // En web el foco ya se ve en el borde burdeo: sin el contorno negro del navegador.
        Platform.OS === 'web' && { outlineWidth: 0 },
        multiline && { minHeight: 96, paddingVertical: spacing.sm + 2, textAlignVertical: 'top' },
        style,
      ]}
      {...props}
    />
  );
}
