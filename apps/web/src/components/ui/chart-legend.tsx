import { cn } from '@/lib/cn';

export interface ChartLegendItem {
  label: string;
  color: string;
}

interface ChartLegendProps {
  items: ChartLegendItem[];
  className?: string;
}

/**
 * Leyenda de gráfico (lib/chart-theme.ts): arriba a la izquierda, marcas redondas de 8px y texto secundario.
 * Es HTML y no parte del SVG para que ajuste de línea y tipografía sean las del sistema.
 */
export function ChartLegend({ items, className }: ChartLegendProps) {
  if (items.length === 0) return null;
  return (
    <ul
      aria-label="Leyenda"
      className={cn('flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400', className)}
    >
      {items.map((item) => (
        <li key={item.label} className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="truncate" title={item.label}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
