import { useEffect, useEffectEvent, useRef, useState, type ComponentRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface SignaturePadProps {
  /** Recibe la firma como `data:image/png;base64,…`, o `''` si se borró o no se pudo capturar. */
  onChange: (dataUrl: string) => void;
  /** Avisa al formulario para pausar su scroll mientras se dibuja. */
  onDrawingChange?: (drawing: boolean) => void;
  invalid?: boolean;
}

/** Firma dibujada con el dedo. El fondo es siempre blanco para que el PNG sea legible en el PDF. */
export function SignaturePad({ onChange, onDrawingChange, invalid }: SignaturePadProps) {
  const theme = useTheme();
  const surface = useRef<ComponentRef<typeof View>>(null);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [drawing, setDrawing] = useState(false);

  const [responder] = useState(() => {
    let path = '';
    const finish = () => {
      const finished = path;
      path = '';
      setCurrent('');
      setDrawing(false);
      if (finished) setStrokes((previous) => [...previous, finished]);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: ({ nativeEvent: { locationX, locationY } }) => {
        setDrawing(true);
        // El segundo punto hace visible un toque sin arrastre.
        path = `M${locationX} ${locationY} L${locationX} ${locationY}`;
        setCurrent(path);
      },
      onPanResponderMove: ({ nativeEvent: { locationX, locationY } }) => {
        path = `${path} L${locationX} ${locationY}`;
        setCurrent(path);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  });

  useEffect(() => {
    onDrawingChange?.(drawing);
  }, [drawing, onDrawingChange]);

  const emitCapture = useEffectEvent((dataUrl: string) => onChange(dataUrl));

  // Captura después de pintar el trazo nuevo; una captura anterior en curso se descarta.
  useEffect(() => {
    if (strokes.length === 0) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      captureRef(surface, { format: 'png', quality: 1, result: 'base64' })
        .then((base64) => {
          if (!cancelled) emitCapture(`data:image/png;base64,${base64}`);
        })
        .catch(() => {
          if (!cancelled) emitCapture('');
        });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [strokes]);

  const clear = () => {
    setStrokes([]);
    setCurrent('');
    onChange('');
  };

  return (
    <View style={styles.container}>
      <View
        ref={surface}
        collapsable={false}
        accessible
        accessibilityLabel="Área para dibujar la firma"
        style={[
          styles.surface,
          { borderColor: invalid ? '#b91c1c' : theme.backgroundSelected },
        ]}
        {...responder.panHandlers}
      >
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {[...strokes, current].filter(Boolean).map((d, index) => (
            <Path
              key={index}
              d={d}
              stroke="#111111"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      </View>
      <Pressable onPress={clear} accessibilityRole="button" hitSlop={8} style={styles.clear}>
        <ThemedText type="small" themeColor="textSecondary">
          Borrar firma
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  surface: {
    height: 150,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  clear: {
    alignSelf: 'flex-end',
  },
});
