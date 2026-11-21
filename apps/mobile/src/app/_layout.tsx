import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';

import { BrandSplash } from '@/components/brand-splash';
import { queryClient } from '@/config/api';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { fonts } from '@/theme';
import { useAppFonts } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync();

function AuthStack() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.inkMuted} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

/** Tema de navegación con la paleta «Trazo» (fondos, bordes y acento de las pantallas nativas). */
function useNavigationTheme(): Theme {
  const name = useThemeName();
  const theme = useTheme();
  const base = name === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.accent,
      background: theme.bg,
      card: theme.surface,
      text: theme.ink,
      border: theme.line,
      notification: theme.danger,
    },
    fonts: {
      ...base.fonts,
      regular: { fontFamily: fonts.regular, fontWeight: '400' },
      medium: { fontFamily: fonts.medium, fontWeight: '500' },
      bold: { fontFamily: fonts.medium, fontWeight: '500' },
      heavy: { fontFamily: fonts.semibold, fontWeight: '600' },
    },
  };
}

export default function RootLayout() {
  const fontsReady = useAppFonts();
  const navigationTheme = useNavigationTheme();
  const name = useThemeName();

  // Hasta que Geist esté lista se mantiene el splash nativo.
  if (!fontsReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
          <BrandSplash />
          <AuthStack />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
