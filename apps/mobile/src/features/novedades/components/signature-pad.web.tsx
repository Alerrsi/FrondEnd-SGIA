import { useEffect, useRef, type PointerEvent } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface SignaturePadProps {
  /** Recibe la firma como `data:image/png;base64,…`, o `''` si se borró. */
  onChange: (dataUrl: string) => void;
  onDrawingChange?: (drawing: boolean) => void;
  invalid?: boolean;
}

const WIDTH = 640;
const HEIGHT = 300;

/** En web la firma se dibuja en un `<canvas>`; la captura nativa no está disponible. */
export function SignaturePad({ onChange, onDrawingChange, invalid }: SignaturePadProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const paintBackground = () => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.strokeStyle = '#111111';
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  };

  useEffect(paintBackground, []);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  };

  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onDrawingChange?.(false);
    onChange(canvas.current?.toDataURL('image/png') ?? '');
  };

  return (
    <View style={styles.container}>
      <canvas
        ref={canvas}
        width={WIDTH}
        height={HEIGHT}
        aria-label="Área para dibujar la firma"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const { x, y } = point(event);
          const context = event.currentTarget.getContext('2d');
          context?.beginPath();
          context?.moveTo(x, y);
          context?.lineTo(x, y);
          context?.stroke();
          drawing.current = true;
          onDrawingChange?.(true);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const { x, y } = point(event);
          const context = event.currentTarget.getContext('2d');
          context?.lineTo(x, y);
          context?.stroke();
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        style={{
          width: '100%',
          height: 150,
          boxSizing: 'border-box',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: invalid ? '#b91c1c' : '#c7c9ce',
          borderRadius: 8,
          touchAction: 'none',
        }}
      />
      <Pressable
        onPress={() => {
          paintBackground();
          onChange('');
        }}
        accessibilityRole="button"
        style={styles.clear}
      >
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
  clear: {
    alignSelf: 'flex-end',
  },
});
