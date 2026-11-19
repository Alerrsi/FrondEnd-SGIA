import { ArrowRight, Check, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

export interface TodayTaskProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Total pendiente; `undefined` mientras carga o si falló la consulta. */
  count: number | undefined;
  isLoading: boolean;
  pendingLabel: string;
}

/** Tarjeta de «Lo que te toca hoy»: cuántos pendientes hay y enlace a la pantalla donde se atienden. */
export function TodayTask({ to, icon: Icon, title, description, count, isLoading, pendingLabel }: TodayTaskProps) {
  const pending = count !== undefined && count > 0;
  const status = isLoading ? 'cargando' : count === undefined ? 'sin datos' : pending ? `${count} ${pendingLabel}` : 'al día';

  return (
    <Link
      to={to}
      aria-label={`${title}: ${status}`}
      className={cn(
        // Celda de un `CellGrid`: comparte líneas con sus vecinas.
        'group relative flex h-full flex-col gap-2 bg-white p-4 transition-colors duration-150 dark:bg-zinc-900',
        'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 focus-visible:outline-2 focus-visible:-outline-offset-2',
        // Barra burdeo arriba: hay algo que atender
        pending && 'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-accent',
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        <Icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
        {title}
      </span>
      {pending ? (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-medium leading-none tracking-[-0.02em] tabular-nums text-zinc-900 dark:text-zinc-100">
            {count}
          </span>
          <span className="text-[13px] text-zinc-600 dark:text-zinc-300">{pendingLabel}</span>
        </span>
      ) : (
        <span className="flex h-7.5 items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          {count !== undefined && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
          {isLoading ? '…' : count === undefined ? '—' : 'Al día'}
        </span>
      )}
      <span className="mt-auto flex items-end justify-between gap-2 text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
        {description}
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-150 group-hover:translate-x-[3px]" />
      </span>
    </Link>
  );
}
