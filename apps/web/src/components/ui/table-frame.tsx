import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/use-media-query';

export interface TableFrameProps {
  /** Barra superior: búsqueda, filtros y acciones (`TableToolbar`). */
  toolbar?: ReactNode;
  /** Pie: paginación o totales. */
  footer?: ReactNode;
  /**
   * Vista para teléfonos (filas apiladas con `MobileRow`). Si se pasa, bajo 768px se renderiza en lugar de
   * la tabla (solo una de las dos está en el DOM); si no, la tabla se desplaza de lado con la primera
   * columna fija (`STICKY_COL_CLASS`).
   */
  mobile?: ReactNode;
  /** Alto máximo del área con scroll (p. ej. `60vh`); con él la cabecera queda fija dentro del marco. */
  maxHeight?: string;
  className?: string;
  /** La `<table>` (con `TABLE_HEAD_CLASS` en `<thead>`), o el estado de carga, vacío o error. */
  children: ReactNode;
}

/** Marco único de tabla: superficie con línea de 1px, barra integrada y scroll horizontal propio. */
export function TableFrame({ toolbar, footer, mobile, maxHeight, className, children }: TableFrameProps) {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const showMobile = mobile != null && isPhone;
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
        className,
      )}
    >
      {toolbar && <div className="border-b border-zinc-200 dark:border-zinc-800">{toolbar}</div>}
      {showMobile ? (
        <div data-table-mobile>{mobile}</div>
      ) : (
        <div
          data-table-scroll
          className={cn(
            'min-w-0 overflow-x-auto overscroll-x-contain',
            maxHeight && 'overflow-y-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[2]',
          )}
          style={maxHeight ? { maxHeight } : undefined}
        >
          {children}
        </div>
      )}
      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-[13px] text-zinc-500 dark:text-zinc-400">
          {footer}
        </div>
      )}
    </section>
  );
}
