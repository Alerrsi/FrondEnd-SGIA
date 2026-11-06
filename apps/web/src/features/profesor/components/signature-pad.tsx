import { useCallback, useRef, type PointerEvent } from 'react';
import { Eraser } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  /** PNG en base64 (`data:image/png;base64,…`) o `''` cuando el lienzo está vacío. */
  onChange: (dataUrl: string) => void;
  invalid?: boolean;
}

const WIDTH = 480;
const HEIGHT = 160;

/** Lienzo para la firma del docente; entrega un PNG pequeño (el backend limita a 512 KB). */
export function SignaturePad({ onChange, invalid }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  const context = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d') ?? null;
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#18181b';
    }
    return ctx;
  }, []);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const ctx = context();
    if (!ctx) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = context();
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current && canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, WIDTH, HEIGHT);
    dirty.current = false;
    onChange('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        aria-label="Firma del docente"
        aria-invalid={invalid || undefined}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-32 w-full touch-none rounded-md border border-dashed border-border bg-surface aria-invalid:border-rose-400"
      />
      <Button type="button" variant="ghost" className="self-start text-xs" onClick={clear}>
        <Eraser className="h-3.5 w-3.5" />
        Borrar firma
      </Button>
    </div>
  );
}
