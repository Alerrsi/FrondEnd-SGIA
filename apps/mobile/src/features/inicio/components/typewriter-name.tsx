import { Text } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { useTypewriter } from '../hooks/use-typewriter';

/**
 * Nombre del saludo escrito a máquina con un guion bajo burdeo como cursor (docs/saludo-animado.md). Va dentro del
 * `ThemedText` del saludo (hereda la tipografía). Lo que falta por escribir se dibuja transparente para que el ancho
 * no cambie. El lector de pantalla usa el `accessibilityLabel` del saludo, no este texto. Con «Reducir movimiento»
 * queda fijo y sin cursor.
 */
export function TypewriterName({ name }: { name: string }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { shown, caretOn } = useTypewriter(name, !reduced);

  if (reduced) return <Text>{name}</Text>;
  return (
    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="typewriter-name">
      {shown}
      <Text style={{ color: theme.accent, opacity: caretOn ? 1 : 0 }}>_</Text>
      <Text style={{ opacity: 0 }}>{name.slice(shown.length)}</Text>
    </Text>
  );
}
