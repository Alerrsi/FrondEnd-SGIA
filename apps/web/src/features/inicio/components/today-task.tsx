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
        'group flex h-full flex-col gap-2 rounded-md border bg-white px-3 py-2.5 shadow-xs transition-all duration-150',
        'hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400',
        'dark:bg-zinc-900 dark:hover:border-zinc-600',
        pending ? 'border-zinc-300 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-800',
      )}
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
        <Icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
        {title}
      </span>
      <span className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{description}</span>
      <span className="mt-auto flex items-center justify-between gap-2 text-[11px]">
        {pending ? (
          <span className="text-zinc-700 dark:text-zinc-300">
            <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{count}</span> {pendingLabel}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
            {count !== undefined && <Check className="h-3 w-3" />}
            {isLoading ? '…' : count === undefined ? '—' : 'Al día'}
          </span>
        )}
        <span className="flex items-center gap-0.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Ver
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}
