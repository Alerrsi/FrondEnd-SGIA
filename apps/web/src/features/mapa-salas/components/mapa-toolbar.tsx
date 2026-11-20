import type { ReactNode } from 'react';

export interface MapaToolbarProps {
  /** Controles que valen para todos (zoom, búsqueda), a la izquierda. */
  children?: ReactNode;
  /** Acciones (editar, crear), a la derecha; a ancho completo en el teléfono. */
  actions?: ReactNode;
}

/** Barra del plano: herramientas a la izquierda y acciones a la derecha; se apila bajo 640 px. */
export function MapaToolbar({ children, actions }: MapaToolbarProps) {
  return (
    <div role="toolbar" aria-label="Herramientas del mapa" className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
      {actions && <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">{actions}</div>}
    </div>
  );
}
