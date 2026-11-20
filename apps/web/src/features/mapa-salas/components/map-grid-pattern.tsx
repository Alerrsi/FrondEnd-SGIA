import { GUIDE_CM } from '../lib/map-geometry';

/** Líneas guía cada 50 cm sobre el piso de la sala (solo en modo edición). */
export function MapGridPattern({ width, height }: { width: number; height: number }) {
  return (
    <g aria-hidden="true" className="pointer-events-none">
      <defs>
        <pattern id="mapa-sala-grid" width={GUIDE_CM} height={GUIDE_CM} patternUnits="userSpaceOnUse">
          <path
            d={`M ${GUIDE_CM} 0 L 0 0 0 ${GUIDE_CM}`}
            fill="none"
            className="stroke-zinc-200/70 dark:stroke-zinc-800"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#mapa-sala-grid)" />
    </g>
  );
}
