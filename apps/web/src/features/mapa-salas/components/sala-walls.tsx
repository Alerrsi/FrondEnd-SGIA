interface SalaWallsProps {
  width: number;
  height: number;
  /** Separación entre las dos líneas del muro, en cm del plano. */
  thickness: number;
}

/** Muro de doble línea y piso de la sala. Líneas de 2 y 1 px a cualquier escala. */
export function SalaWalls({ width, height, thickness }: SalaWallsProps) {
  return (
    <g aria-hidden="true">
      <rect
        x={-thickness}
        y={-thickness}
        width={width + thickness * 2}
        height={height + thickness * 2}
        className="fill-zinc-200 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        width={width}
        height={height}
        className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
