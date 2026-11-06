import { cn } from '@/lib/cn';

interface BudgetExecutionBarProps {
  initial: number;
  consumed: number;
  reserved: number;
  /** `execution_percent` del backend: (consumido + reservado) / inicial × 100. */
  percent: number;
  className?: string;
  /** Ancho de la barra; por defecto la microbarra de tabla (`w-16`). */
  barClassName?: string;
}

/**
 * Microbarra de ejecución: consumido (sólido) + reservado (tenue). Tono ámbar desde 80 % y rosa desde 100 %.
 */
export function BudgetExecutionBar({
  initial,
  consumed,
  reserved,
  percent,
  className,
  barClassName = 'w-16',
}: BudgetExecutionBarProps) {
  const safe = initial > 0 ? initial : 1;
  const consumedPct = Math.min(100, (consumed / safe) * 100);
  const reservedPct = Math.min(100 - consumedPct, (reserved / safe) * 100);
  const tone =
    percent >= 100
      ? 'bg-rose-500'
      : percent >= 80
        ? 'bg-amber-500'
        : 'bg-zinc-800 dark:bg-zinc-200';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('flex h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800', barClassName)}
        role="meter"
        aria-label="Ejecución del presupuesto"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className={cn('h-full', tone)} style={{ width: `${consumedPct}%` }} />
        <div className={cn('h-full opacity-40', tone)} style={{ width: `${reservedPct}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-text">
        {percent.toLocaleString('es-CL', { maximumFractionDigits: 1 })}%
      </span>
    </div>
  );
}
