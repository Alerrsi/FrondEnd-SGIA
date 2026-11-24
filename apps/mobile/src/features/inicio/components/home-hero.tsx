import { CalendarClock, ClipboardPlus, FileWarning } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import { TypewriterName } from './typewriter-name';

/** Saludo de Inicio: quién eres (el nombre se escribe a máquina, docs/saludo-animado.md), qué día es y la acción principal del docente. */
export function HomeHero({ firstName, context }: { firstName: string; context: string }) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.hero, { borderBottomColor: theme.line }]}>
      <View style={styles.text}>
        <ThemedText variant="hero" accessibilityRole="header" accessibilityLabel={`Hola, ${firstName}`}>
          Hola, <TypewriterName name={firstName} />
        </ThemedText>
        <ThemedText variant="subtitle">{context}</ThemedText>
      </View>
      <Button
        title="Solicitar equipo"
        onPress={() => router.navigate('/solicitar')}
        icon={(color) => <ClipboardPlus size={16} color={color} aria-hidden />}
      />
      <View style={styles.secondary}>
        <Button
          title="Reportar una falla"
          variant="secondary"
          size="sm"
          // Cada toque lleva otra marca para que Novedades abra el formulario aunque ya estuviera montada.
          onPress={() => router.navigate({ pathname: '/novedades', params: { nuevo: String(Date.now()) } })}
          icon={(color) => <FileWarning size={16} color={color} aria-hidden />}
          style={styles.flex}
        />
        <Button
          title="Mis préstamos"
          variant="secondary"
          size="sm"
          onPress={() => router.navigate('/explore')}
          icon={(color) => <CalendarClock size={16} color={color} aria-hidden />}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.lg, paddingBottom: spacing.xl, borderBottomWidth: 1 },
  text: { gap: spacing.xs },
  secondary: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
