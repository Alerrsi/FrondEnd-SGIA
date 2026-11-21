import { useProducts } from '@sgia/api-client';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { dropdownStyle } from '@/components/ui/control-style';
import { Field } from '@/components/ui/field';
import { Section } from '@/components/ui/section';
import { TextField } from '@/components/ui/text-field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { spacing, TOUCH } from '@/theme';

const MAX_SUGGESTIONS = 5;

/** Búsqueda del catálogo desde Inicio: no deja buscar vacío, sugiere productos y lleva a Solicitar con la búsqueda. */
export function CatalogSearch() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const debounced = useDebouncedValue(query.trim());
  // En web el blur llega antes del toque en la sugerencia: se cierra la lista con un pequeño retraso.
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const { data } = useProducts({
    search: debounced || undefined,
    is_active: true,
    per_page: MAX_SUGGESTIONS,
  });
  const names = debounced
    ? Array.from(new Set((data?.data ?? []).map((p) => p.nombre ?? '').filter((n) => n !== ''))).slice(
        0,
        MAX_SUGGESTIONS,
      )
    : [];
  const showSuggestions = focused && query.trim() !== '' && names.length > 0;

  const go = (q: string) => {
    setFocused(false);
    // Inicio sigue montado entre pestañas: al volver, el campo queda listo para otra búsqueda.
    setQuery('');
    router.navigate({ pathname: '/solicitar', params: { q, t: String(Date.now()) } });
  };

  const submit = () => {
    const q = query.trim();
    if (!q) {
      setError('Escribe qué necesitas antes de buscar.');
      return;
    }
    go(q);
  };

  return (
    <Section>
      <Field label="¿Qué necesitas para tu clase?" error={error || undefined}>
        <View style={styles.row}>
          <View style={styles.input}>
            <TextField
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setError('');
              }}
              onFocus={() => {
                clearTimeout(blurTimer.current);
                setFocused(true);
              }}
              onBlur={() => {
                blurTimer.current = setTimeout(() => setFocused(false), 200);
              }}
              onSubmitEditing={submit}
              invalid={Boolean(error)}
              returnKeyType="search"
              placeholder="Notebook, osciloscopio, cable HDMI…"
              accessibilityLabel="Buscar en el catálogo"
              style={styles.field}
            />
            <Search size={16} color={theme.inkMuted} style={styles.icon} aria-hidden />
          </View>
          <Button title="Buscar" variant="secondary" onPress={submit} />
        </View>
      </Field>

      {showSuggestions && (
        <View style={[dropdownStyle(theme), styles.suggestions]} accessibilityLabel="Sugerencias">
          {names.map((name, index) => (
            <Pressable
              key={name}
              onPress={() => go(name)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.suggestion,
                index > 0 && { borderTopWidth: 1, borderTopColor: theme.line },
                pressed && { backgroundColor: theme.surfaceAlt },
              ]}
            >
              <ThemedText variant="body" numberOfLines={1}>
                {name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1 },
  // El icono va dentro del campo, a la izquierda.
  field: { paddingHorizontal: 0, paddingLeft: spacing.xxl + spacing.xs, paddingRight: spacing.md },
  icon: { position: 'absolute', left: spacing.md, top: (TOUCH - 16) / 2 },
  suggestions: { marginTop: 0 },
  suggestion: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: spacing.md },
});
