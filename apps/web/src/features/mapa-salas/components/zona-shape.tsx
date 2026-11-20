import { memo } from 'react';
import type { Zona } from '@sgia/types';

export interface ZonaShapeProps {
  zona: Zona;
  /** Tamaño de letra en cm del plano (13 px en pantalla). */
  fontSize: number;
}

/** Zona de la sala: rectángulo de 1 px con su nombre arriba al centro. */
export const ZonaShape = memo(function ZonaShape({ zona, fontSize }: ZonaShapeProps) {
  const fits = zona.nombre.length * fontSize * 0.6 < zona.width;
  return (
    <g data-zona-id={zona.id} transform={`translate(${zona.x} ${zona.y})`}>
      <rect
        width={zona.width}
        height={zona.depth}
        className="fill-zinc-50 stroke-zinc-200 dark:fill-zinc-950 dark:stroke-zinc-800"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {fits && (
        <text
          x={zona.width / 2}
          y={fontSize * 1.6}
          textAnchor="middle"
          fontSize={fontSize}
          className="pointer-events-none fill-zinc-500 select-none dark:fill-zinc-400"
        >
          {zona.nombre}
        </text>
      )}
    </g>
  );
});
