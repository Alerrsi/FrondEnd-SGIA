import { memo, type KeyboardEvent, type PointerEvent } from 'react';
import type { Estante } from '@sgia/types';

import { cn } from '@/lib/cn';
import { estanteRect, estimateTextWidth } from '../lib/map-geometry';
import { estanteAriaLabel } from '../lib/map-labels';

export interface EstanteShapeProps {
  estante: Estante;
  zonaNombre: string | null;
  /** Píxeles de pantalla por cm: textos, radios y marcadores miden lo mismo a cualquier escala. */
  pxPerCm: number;
  selected?: boolean;
  /** Contiene lo buscado en «Buscar en la sala»: fondo burdeo suave (el punto rojo queda para stock crítico). */
  marked?: boolean;
  /** Modo edición: el puntero arrastra en vez de abrir. */
  editable?: boolean;
  onActivate: (estante: Estante) => void;
  onPrefetch?: (id: number) => void;
  onDragStart?: (event: PointerEvent<SVGGElement>, estante: Estante) => void;
  onEditKey?: (event: KeyboardEvent<SVGGElement>, estante: Estante) => void;
}

const LABEL_PX = 12;
const DOT_PX = 4;

/**
 * Estante del plano: marco, franja con el código y una celda por cajón, como la referencia. Los vertical
 * (rotación 90) llevan el texto girado. Se mueve con `transform` para que el arrastre no pase por React.
 */
export const EstanteShape = memo(function EstanteShape({
  estante,
  zonaNombre,
  pxPerCm,
  selected = false,
  marked = false,
  editable = false,
  onActivate,
  onPrefetch,
  onDragStart,
  onEditKey,
}: EstanteShapeProps) {
  const { w, h } = estanteRect(estante);
  const vertical = h > w;
  const longSide = vertical ? h : w;
  const shortSide = vertical ? w : h;
  const fontSize = LABEL_PX / pxPerCm;
  const band = Math.min(shortSide * 0.45, fontSize * 2.2);
  const showCode = estimateTextWidth(estante.codigo, fontSize) < longSide * 0.9 && fontSize * 1.1 < band;
  const radius = Math.min(4 / pxPerCm, shortSide / 4);
  const dot = DOT_PX / pxPerCm;
  const cells = estante.cajones.length;
  const label = `${estanteAriaLabel(estante, zonaNombre)}${marked ? ', coincide con la búsqueda' : ''}`;

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate(estante);
      return;
    }
    onEditKey?.(event, estante);
  };

  return (
    <g
      data-estante-id={estante.id}
      transform={`translate(${estante.x} ${estante.y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={editable ? selected : undefined}
      className={cn(
        'group outline-none',
        editable ? 'cursor-grab touch-none data-[dragging=true]:cursor-grabbing' : 'cursor-pointer',
      )}
      onClick={editable ? undefined : () => onActivate(estante)}
      onPointerDown={editable && onDragStart ? (event) => onDragStart(event, estante) : undefined}
      onKeyDown={handleKeyDown}
      onPointerEnter={onPrefetch ? () => onPrefetch(estante.id) : undefined}
      onFocus={onPrefetch ? () => onPrefetch(estante.id) : undefined}
    >
      <title>{label}</title>
      <rect
        width={w}
        height={h}
        rx={radius}
        className={cn(
          'transition-colors',
          marked
            ? 'fill-accent-soft'
            : 'fill-white group-hover:fill-zinc-50 dark:fill-zinc-900 dark:group-hover:fill-zinc-800',
          selected ? 'stroke-accent' : 'stroke-zinc-400 dark:stroke-zinc-600',
          'group-focus-visible:stroke-accent group-data-[invalid=true]:stroke-danger',
        )}
        strokeWidth={selected ? 2 : 1}
        vectorEffect="non-scaling-stroke"
      />
      {vertical ? (
        <>
          <line x1={w - band} y1={0} x2={w - band} y2={h} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {Array.from({ length: Math.max(0, cells - 1) }, (_, i) => (
            <line key={i} x1={0} x2={w - band} y1={(h / cells) * (i + 1)} y2={(h / cells) * (i + 1)} className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {showCode && (
            <text
              transform={`translate(${w - band / 2} ${h / 2}) rotate(-90)`}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              className="pointer-events-none font-code fill-zinc-700 select-none dark:fill-zinc-200"
            >
              {estante.codigo}
            </text>
          )}
        </>
      ) : (
        <>
          <line x1={0} y1={band} x2={w} y2={band} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {Array.from({ length: Math.max(0, cells - 1) }, (_, i) => (
            <line key={i} y1={band} y2={h} x1={(w / cells) * (i + 1)} x2={(w / cells) * (i + 1)} className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {showCode && (
            <text
              x={w / 2}
              y={band / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              className="pointer-events-none font-code fill-zinc-700 select-none dark:fill-zinc-200"
            >
              {estante.codigo}
            </text>
          )}
        </>
      )}
      {estante.has_critical_stock && <circle cx={w - dot * 2} cy={dot * 2} r={dot} className="fill-danger" />}
    </g>
  );
});
