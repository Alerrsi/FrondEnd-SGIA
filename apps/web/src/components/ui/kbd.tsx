import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Atajo de teclado junto a la acción que dispara (`Ctrl K`, `N`, `/`). Solo con puntero fino:
 * en pantallas táctiles no hay teclado físico y se oculta.
 */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'hidden pointer-fine:inline-flex shrink-0 whitespace-nowrap h-5 min-w-5 items-center justify-center rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1 font-code text-xs leading-none text-zinc-500 dark:text-zinc-400',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
