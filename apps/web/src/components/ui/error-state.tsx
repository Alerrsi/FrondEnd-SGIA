import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/cn';

/** Error al cargar o guardar: una línea en el tono de peligro, con una acción opcional (reintentar). */
export function ErrorState({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-wrap items-center gap-2 rounded-lg bg-danger-bg px-4 py-3 text-[13px] font-medium text-danger', className)}>
      <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}
