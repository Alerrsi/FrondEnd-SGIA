import type { ReactNode } from 'react';
import { Check, LayoutGrid, Pencil, Plus, Ruler } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface MapaToolbarProps {
  canEdit: boolean;
  editing: boolean;
  onToggleEdit: () => void;
  onNewEstante: () => void;
  onNewZona: () => void;
  onDimensions: () => void;
  /** Controles que valen para todos (zoom, búsqueda). */
  children?: ReactNode;
}

/** Barra del plano: herramientas para todos a la izquierda y edición (solo PAN-01 y DIR-01) a la derecha. */
export function MapaToolbar({ canEdit, editing, onToggleEdit, onNewEstante, onNewZona, onDimensions, children }: MapaToolbarProps) {
  return (
    <div role="toolbar" aria-label="Herramientas del mapa" className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
      {canEdit && (
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {editing && (
            <>
              <Button size="sm" variant="secondary" onClick={onDimensions}>
                <Ruler aria-hidden="true" className="h-4 w-4" /> Medidas
              </Button>
              <Button size="sm" variant="secondary" onClick={onNewZona}>
                <LayoutGrid aria-hidden="true" className="h-4 w-4" /> Nueva zona
              </Button>
              <Button size="sm" variant="primary" onClick={onNewEstante}>
                <Plus aria-hidden="true" className="h-4 w-4" /> Nuevo estante
              </Button>
            </>
          )}
          <Button size="sm" variant={editing ? 'secondary' : 'primary'} aria-pressed={editing} onClick={onToggleEdit}>
            {editing ? <Check aria-hidden="true" className="h-4 w-4" /> : <Pencil aria-hidden="true" className="h-4 w-4" />}
            {editing ? 'Terminar edición' : 'Editar distribución'}
          </Button>
        </div>
      )}
    </div>
  );
}
