import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface MobileRowProps {
  title: ReactNode;
  /** Segunda línea: código, ubicación, fecha. */
  meta?: ReactNode;
  /** A la derecha: estado (`Badge`) o cifra. */
  trailing?: ReactNode;
  /** Con `onClick` la fila entera es un botón de 44px o más. */
  onClick?: () => void;
  className?: string;
}

/** Fila apilada de una tabla en teléfonos (va en `TableFrame mobile`). Una lista `<ul>` de estas filas. */
export function MobileRow({ title, meta, trailing, onClick, className }: MobileRowProps) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        {meta && <span className="truncate text-[13px] text-zinc-500 dark:text-zinc-400">{meta}</span>}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
      {onClick && <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />}
    </>
  );
  const classes = cn(
    'flex min-h-14 w-full items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 last:border-b-0',
    className,
  );
  return (
    <li className="list-none">
      {onClick ? (
        <button type="button" onClick={onClick} className={cn(classes, 'cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-800/50')}>
          {body}
        </button>
      ) : (
        <div className={classes}>{body}</div>
      )}
    </li>
  );
}
