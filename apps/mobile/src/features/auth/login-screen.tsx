import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiRequestError } from '@sgia/api-client';
import { Controller, useForm } from 'react-hook-form';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

  const inputStyle = [
    styles.input,
    { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="code" style={styles.tag}>
            INACAP SEDE TEMUCO · PAÑOL TI
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Iniciar sesión
          </ThemedText>
          <ThemedText themeColor="textSecondary">Acceso para docentes.</ThemedText>

          <View style={styles.field}>
            <ThemedText type="small">Correo</ThemedText>
            <Controller
              control={control}
              name="email"
              rules={{ required: 'Ingresa tu correo.' }}
              render={({ field }) => (
                <TextInput
                  {...field}
                  onChangeText={field.onChange}
                  style={inputStyle}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="nombre@inacap.cl"
                  placeholderTextColor="#888"
                />
              )}
            />
            {errors.email && <ThemedText type="small" style={styles.error}>{errors.email.message}</ThemedText>}
          </View>

          <View style={styles.field}>
            <ThemedText type="small">Contraseña</ThemedText>
            <Controller
              control={control}
              name="password"
              rules={{ required: 'Ingresa tu contraseña.' }}
              render={({ field }) => (
                <TextInput
                  {...field}
                  onChangeText={field.onChange}
                  style={inputStyle}
                  editable={!isSubmitting}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  onSubmitEditing={onSubmit}
                  placeholderTextColor="#888"
                />
              )}
            />
            {errors.password && (
              <ThemedText type="small" style={styles.error}>{errors.password.message}</ThemedText>
            )}
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              accessibilityRole="button"
              hitSlop={8}>
              <ThemedText type="small" themeColor="textSecondary">
                {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </ThemedText>
            </Pressable>
          </View>

          {authError && (
            <ThemedText type="small" style={styles.error} accessibilityRole="alert">
              {authError}
            </ThemedText>
          )}

          <Pressable
            onPress={onSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: theme.text }, isSubmitting && { opacity: 0.6 }]}>
            {isSubmitting ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: theme.background }]}>Entrar</ThemedText>
            )}
          </Pressable>
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
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  tag: { fontSize: 10, letterSpacing: 0.5, color: '#d9232a' },
  title: { fontSize: 28, lineHeight: 34 },
  field: { gap: 4 },
  input: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  error: { color: '#d9232a' },
  button: { height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 14, fontWeight: '700' },
});
