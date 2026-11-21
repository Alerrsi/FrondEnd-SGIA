import type { LucideIcon } from 'lucide-react-native';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { easeUi, motion, radius, spacing, TOUCH } from '@/theme';

/**
 * Menú inferior con el lenguaje del riel del sidebar web encogido (`IconNav` / `.bar-well`):
 * pozo en superficie con borde de 1 px y radio 16, solo iconos, e indicador en `surfaceAlt` con borde
 * que se desliza hasta el ítem activo (sin rebote; quieto con «reducir movimiento»).
 */

const ITEM_W = 56;
const ITEM_H = TOUCH;
const PAD = 4;

type Slot = { x: number; w: number };

const BarContext = createContext<{
  report: (key: string, slot: Slot) => void;
  setActive: (key: string) => void;
} | null>(null);

export function IconTabBar({ children }: { children?: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const [active, setActive] = useState<string | null>(null);
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const shown = useSharedValue(0);
  const placed = useRef(false);

  const report = useCallback((key: string, slot: Slot) => {
    setSlots((current) =>
      current[key]?.x === slot.x && current[key]?.w === slot.w ? current : { ...current, [key]: slot },
    );
  }, []);

  useEffect(() => {
    const slot = active ? slots[active] : undefined;
    if (!slot) return;
    // La primera vez se coloca sin animar; después se desliza.
    if (!placed.current || reduceMotion) {
      x.value = slot.x;
      w.value = slot.w;
      shown.value = 1;
      placed.current = true;
      return;
    }
    x.value = withTiming(slot.x, { duration: motion.slide, easing: easeUi });
    w.value = withTiming(slot.w, { duration: motion.slide, easing: easeUi });
  }, [active, slots, reduceMotion, x, w, shown]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: w.value,
    opacity: shown.value,
    transform: [{ translateX: x.value }],
  }));

  const context = useMemo(() => ({ report, setActive }), [report]);

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, spacing.sm), backgroundColor: theme.bg }]}>
      <View
        accessibilityRole="tablist"
        style={[styles.well, { backgroundColor: theme.surface, borderColor: theme.line }]}
      >
        <View style={styles.track}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.line },
              indicatorStyle,
            ]}
          />
          <BarContext value={context}>{children}</BarContext>
        </View>
      </View>
    </View>
  );
}

export type IconTabButtonProps = TabTriggerSlotProps & {
  tabKey: string;
  label: string;
  icon: LucideIcon;
};

/** Botón de icono del menú. `TabTrigger asChild` le pasa `isFocused` y `onPress`. */
export function IconTabButton({ tabKey, label, icon: Icon, isFocused, ref, ...props }: IconTabButtonProps) {
  const theme = useTheme();
  const bar = use(BarContext);

  useEffect(() => {
    if (isFocused) bar?.setActive(tabKey);
  }, [isFocused, tabKey, bar]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    bar?.report(tabKey, { x, w: width });
  };

  return (
    <Pressable
      {...props}
      // expo-router tipa `ref` como referencia al componente, no a la instancia que recibe.
      ref={ref as unknown as ComponentProps<typeof Pressable>['ref']}
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(isFocused) }}
      style={({ pressed }) => [styles.item, pressed && !isFocused && { opacity: 0.6 }]}
    >
      <Icon size={20} strokeWidth={isFocused ? 2.25 : 2} color={isFocused ? theme.ink : theme.inkMuted} aria-hidden />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  well: {
    borderWidth: 1,
    borderRadius: radius.bar,
    borderCurve: 'continuous',
    padding: 2,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAD,
    padding: PAD,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: PAD,
    height: ITEM_H,
    borderWidth: 1,
    borderRadius: radius.bar - PAD,
    borderCurve: 'continuous',
  },
  item: {
    width: ITEM_W,
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.bar - PAD,
  },
});
