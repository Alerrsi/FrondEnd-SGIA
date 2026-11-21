import { useState } from 'react';
import { Boxes } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiRequestError } from '@sgia/api-client';
import { Controller, useForm } from 'react-hook-form';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';
import { useAuth } from './auth-context';

interface LoginFormValues {
  email: string;
  password: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 || error.status === 422) return 'Correo o contraseña incorrectos.';
    if (error.status === 429) return 'Demasiados intentos. Espera un minuto.';
    return error.body?.message ?? `Error ${error.status}`;
  }
  return error instanceof Error ? error.message : 'No se pudo conectar con el servidor.';
}

export function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setAuthError(null);
    try {
      await login(email.trim(), password);
    } catch (error) {
      setAuthError(errorMessage(error));
    }
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Marca, como en el login web */}
          <View style={styles.brand}>
            <View style={[styles.mark, { borderColor: theme.line, backgroundColor: theme.surface }]}>
              <Boxes size={24} color={theme.ink} aria-hidden />
            </View>
            <View style={[styles.sede, { backgroundColor: theme.accentSoft }]}>
              <View style={[styles.sedeDot, { backgroundColor: theme.accent }]} />
              <ThemedText variant="caption" tone="accent">
                Sede Temuco · Pañol TI
              </ThemedText>
            </View>
            <ThemedText variant="hero">SGIA</ThemedText>
            <ThemedText variant="secondary" style={styles.center}>
              Sistema de Gestión de Inventario y Activos
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <View style={[styles.cardHead, { borderBottomColor: theme.line }]}>
              <ThemedText variant="section" accessibilityRole="header">
                Iniciar sesión
              </ThemedText>
              <ThemedText variant="secondary">Acceso para docentes.</ThemedText>
            </View>

            <Field label="Correo" error={errors.email?.message}>
              <Controller
                control={control}
                name="email"
                rules={{ required: 'Ingresa tu correo.' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChangeText={field.onChange}
                    invalid={Boolean(errors.email)}
                    editable={!isSubmitting}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    placeholder="nombre@inacap.cl"
                    accessibilityLabel="Correo"
                  />
                )}
              />
            </Field>

            <Field label="Contraseña" error={errors.password?.message}>
              <Controller
                control={control}
                name="password"
                rules={{ required: 'Ingresa tu contraseña.' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChangeText={field.onChange}
                    invalid={Boolean(errors.password)}
                    editable={!isSubmitting}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    textContentType="password"
                    onSubmitEditing={() => void onSubmit()}
                    accessibilityLabel="Contraseña"
                  />
                )}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                accessibilityRole="button"
                hitSlop={12}
                style={styles.toggle}>
                <ThemedText variant="secondary">
                  {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                </ThemedText>
              </Pressable>
            </Field>

            {authError && (
              <View style={[styles.alert, { backgroundColor: theme.dangerBg }]}>
                <ThemedText variant="secondary" tone="danger" accessibilityRole="alert">
                  {authError}
                </ThemedText>
              </View>
            )}

            <Button title="Entrar" onPress={() => void onSubmit()} loading={isSubmitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  mark: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sede: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  sedeDot: { width: 6, height: 6, borderRadius: radius.full },
  center: { textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardHead: { gap: spacing.xxs, paddingBottom: spacing.md, borderBottomWidth: 1 },
  toggle: { alignSelf: 'flex-start', minHeight: 24, justifyContent: 'center' },
  alert: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
