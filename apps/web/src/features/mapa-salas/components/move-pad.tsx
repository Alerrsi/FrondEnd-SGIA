import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { KEY_STEP_CM } from '../lib/map-geometry';

export interface MovePadProps {
  codigo: string;
  onMove: (dx: number, dy: number) => void;
  onRotate: () => void;
}

/** Flechas de 44 px para mover el estante seleccionado sin arrastrar (pantallas táctiles y precisión fina). */
export function MovePad({ codigo, onMove, onRotate }: MovePadProps) {
  const step = KEY_STEP_CM;
  return (
    <div role="group" aria-label={`Mover estante ${codigo}`} className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-[13px] text-zinc-500 dark:text-zinc-400">
        <span className="font-code text-zinc-700 dark:text-zinc-200">{codigo}</span> · 10 cm por paso
      </span>
      <Button size="icon" variant="secondary" aria-label="Mover a la izquierda" onClick={() => onMove(-step, 0)}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Mover arriba" onClick={() => onMove(0, -step)}>
        <ArrowUp aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Mover abajo" onClick={() => onMove(0, step)}>
        <ArrowDown aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Mover a la derecha" onClick={() => onMove(step, 0)}>
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Girar 90°" onClick={onRotate}>
        <RotateCw aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}
