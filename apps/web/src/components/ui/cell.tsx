import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

export interface CellProps {
  /** Con `to`, toda la celda es un enlace interno. */
  to?: string;
  /** Ocupa dos columnas desde 640px. */
  wide?: boolean;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

const BASE = 'flex min-w-0 flex-col gap-2 bg-white dark:bg-zinc-900 p-4';

/** Celda de un `CellGrid`. Enlazada, responde al puntero con un fondo apenas más oscuro. */
export function Cell({ to, wide, className, children, ...rest }: CellProps) {
  const classes = cn(BASE, wide && 'sm:col-span-2', className);
  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          classes,
          'group transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 focus-visible:outline-2 focus-visible:-outline-offset-2',
        )}
        {...rest}
      >
        {children}
      </Link>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
