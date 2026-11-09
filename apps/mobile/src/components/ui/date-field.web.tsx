import { useTheme } from '@/hooks/use-theme';

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

/** En web el selector nativo de la librería no existe: se usa `<input type="date">`. */
export function DateField({
  accessibilityLabel,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const theme = useTheme();

  return (
    <input
      type="date"
      aria-label={accessibilityLabel}
      value={value}
      min={minimumDate}
      max={maximumDate}
      onChange={(event) => {
        // Al borrar el campo el navegador entrega '': se conserva la última fecha válida.
        if (event.target.value) onChange(event.target.value);
      }}
      style={{
        minHeight: 44,
        boxSizing: 'border-box',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 8,
        paddingLeft: 12,
        paddingRight: 12,
        fontSize: 13,
        color: theme.text,
        borderColor: theme.backgroundSelected,
        backgroundColor: theme.background,
      }}
    />
  );
}
