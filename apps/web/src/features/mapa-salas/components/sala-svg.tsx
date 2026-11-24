import type { PointerEvent, ReactNode, Ref } from 'react';

import { SalaWalls } from './sala-walls';

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SalaSvgProps {
  ref?: Ref<SVGSVGElement>;
  /** Nombre de la sala para el lector de pantalla. */
  label: string;
  width: number;
  height: number;
  viewBox: ViewBox;
  pxPerCm: number;
  /** Capa bajo los estantes (rejilla, zonas). */
  background?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Desplazar la vista arrastrando el fondo (con zoom). */
  onPointerDown?: (event: PointerEvent<SVGSVGElement>) => void;
  /** Tamaño en píxeles ya ajustado a la caja (`fitSize`); sin él, la proporción la da `aspect-ratio`. */
  size?: { width: number; height: number } | null;
}

/** `<svg>` raíz del plano: el `viewBox` es la sala en cm; el zoom cambia el `viewBox`, no el CSS. */
export function SalaSvg({ ref, label, width, height, viewBox, pxPerCm, background, children, className, onPointerDown, size }: SalaSvgProps) {
  return (
    <svg
      ref={ref}
      role="group"
      aria-label={`Plano de ${label}`}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={size ? { width: size.width, height: size.height } : { aspectRatio: `${viewBox.w} / ${viewBox.h}` }}
      onPointerDown={onPointerDown}
    >
      <SalaWalls width={width} height={height} thickness={6 / pxPerCm} />
      {background}
      {children}
    </svg>
  );
}

/** Margen alrededor de la sala para que el muro se vea completo. */
export function initialViewBox(width: number, height: number): ViewBox {
  const pad = Math.max(width, height) * 0.03;
  return { x: -pad, y: -pad, w: width + pad * 2, h: height + pad * 2 };
}
