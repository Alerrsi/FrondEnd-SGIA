import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Barra de una tabla, dentro de su marco: búsqueda a la izquierda (crece), filtros como controles
 * compactos y acciones al final. Bajo 640px cada control ocupa el ancho.
 */
export function TableToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-2.5 sm:flex-row sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto',
        className,
      )}
    >
      {children}
    </div>
  );
}
