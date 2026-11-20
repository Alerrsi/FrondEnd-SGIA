import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

/** Aviso de una línea sobre el plano (sala sin medidas, cajones sin estante), con su acción. */
export function MapNotice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-[13px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}
