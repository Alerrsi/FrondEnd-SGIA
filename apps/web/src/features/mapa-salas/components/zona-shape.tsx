import { memo, type PointerEvent } from 'react';
import type { Zona } from '@sgia/types';

import { cn } from '@/lib/cn';
import type { Rect } from '../lib/map-geometry';

export interface ZonaShapeProps {
  zona: Zona;
  /** Tamaño de letra en cm del plano (13 px en pantalla). */
  fontSize: number;
  /** Modo edición: se arrastra desde su superficie y se redimensiona desde la esquina inferior derecha. */
  editable?: boolean;
  /** Lado del tirador en cm (14 px en pantalla). */
  handleSize?: number;
  onDragStart?: (event: PointerEvent<SVGGElement>, zona: Zona, mode: 'move' | 'resize') => void;
  onEdit?: (zona: Zona) => void;
}

/** Escribe el rectángulo de una zona en el DOM durante el arrastre (sin pasar por React). */
export function applyZonaRect(element: SVGGElement, rect: Rect, invalid: boolean) {
  element.setAttribute('transform', `translate(${rect.x} ${rect.y})`);
  element.dataset.invalid = String(invalid);
  const frame = element.querySelector('[data-zona-frame]');
  frame?.setAttribute('width', String(rect.w));
  frame?.setAttribute('height', String(rect.h));
  element.querySelector('[data-zona-handle]')?.setAttribute('transform', `translate(${rect.w} ${rect.h})`);
  element.querySelector('[data-zona-label]')?.setAttribute('x', String(rect.w / 2));
}

/** Zona de la sala: rectángulo de 1 px con su nombre arriba al centro. */
export const ZonaShape = memo(function ZonaShape({
  zona,
  fontSize,
  editable = false,
  handleSize = 14,
  onDragStart,
  onEdit,
}: ZonaShapeProps) {
  const fits = zona.nombre.length * fontSize * 0.6 < zona.width;
  return (
    <g
      data-zona-id={zona.id}
      transform={`translate(${zona.x} ${zona.y})`}
      className={cn('group/zona', editable && 'cursor-move touch-none')}
      onPointerDown={editable && onDragStart ? (event) => onDragStart(event, zona, 'move') : undefined}
      onDoubleClick={editable && onEdit ? () => onEdit(zona) : undefined}
    >
      <rect
        data-zona-frame
        width={zona.width}
        height={zona.depth}
        className={cn(
          'fill-zinc-50 stroke-zinc-200 dark:fill-zinc-950 dark:stroke-zinc-800',
          editable && 'stroke-zinc-300 [stroke-dasharray:4_3] dark:stroke-zinc-700',
          'group-data-[invalid=true]/zona:stroke-danger',
        )}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {fits && (
        <text
          data-zona-label
          x={zona.width / 2}
          y={fontSize * 1.6}
          textAnchor="middle"
          fontSize={fontSize}
          className="pointer-events-none fill-zinc-500 select-none dark:fill-zinc-400"
        >
          {zona.nombre}
        </text>
      )}
      {editable && onDragStart && (
        <g
          data-zona-handle
          transform={`translate(${zona.width} ${zona.depth})`}
          className="cursor-nwse-resize"
          onPointerDown={(event) => {
            event.stopPropagation();
            onDragStart(event, zona, 'resize');
          }}
        >
          <title>{`Redimensionar ${zona.nombre}`}</title>
          <rect
            x={-handleSize}
            y={-handleSize}
            width={handleSize}
            height={handleSize}
            className="fill-white stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-500"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      )}
    </g>
  );
});
