import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import type { HeadingIcon } from './typography';

export interface EmptyStateProps {
  icon?: HeadingIcon;
  title: string;
  description?: ReactNode;
  /** La acción que resuelve el vacío («Agregar producto», «Limpiar filtros»). */
  action?: ReactNode;
  className?: string;
}

/** Estado vacío: icono, una frase y la acción que lo resuelve. Nunca un cero sin contexto. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-4 py-10 text-center', className)}>
      {Icon && (
        <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
