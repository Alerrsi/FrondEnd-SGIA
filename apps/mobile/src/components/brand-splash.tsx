import * as SplashScreen from 'expo-splash-screen';
import { Boxes } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { easeUi, motion, radius, spacing } from '@/theme';

/**
 * Continúa el splash nativo con la marca SGIA (icono `Boxes` del web sobre papel o grafito) y se desvanece
 * en 240 ms al montar la app. Sin escalados ni rebote.
 */
export function BrandSplash() {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);

  if (!visible) return null;

  return (
    <Animated.View
      exiting={reduceMotion ? undefined : FadeOut.duration(motion.slide).easing(easeUi)}
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: theme.bg }]}
      onLayout={() => {
        if (hidden) return;
        setHidden(true);
        SplashScreen.hideAsync().finally(() => setVisible(false));
      }}
    >
      <View style={[styles.mark, { borderColor: theme.line, backgroundColor: theme.surface }]}>
        <Boxes size={28} color={theme.ink} aria-hidden />
      </View>
      <ThemedText variant="title">SGIA</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 1000,
  },
  mark: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
