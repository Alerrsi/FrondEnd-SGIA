import type { Estante, Zona } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { plural } from '../lib/map-labels';

export interface EstantesListProps {
  estantes: Estante[];
  zonas: Zona[];
  onOpen: (estante: Estante) => void;
}

/** Alternativa en texto del plano: misma información y el mismo pop-up, para lectores de pantalla y teléfonos. */
export function EstantesList({ estantes, zonas, onOpen }: EstantesListProps) {
  const zonaNombre = new Map(zonas.map((zona) => [zona.id, zona.nombre]));
  return (
    <details className="group rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-900 select-none dark:text-zinc-100 pointer-coarse:py-3.5">
        Estantes de la sala ({estantes.length})
      </summary>
      {estantes.length === 0 ? (
        <p className="border-t border-zinc-200 px-4 py-3 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Esta sala todavía no tiene estantes.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {estantes.map((estante) => (
            <li key={estante.id}>
              <button
                type="button"
                onClick={() => onOpen(estante)}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left text-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-zinc-800/60 pointer-coarse:py-3"
              >
                <span className="font-code text-zinc-900 dark:text-zinc-100">{estante.codigo}</span>
                {estante.nombre && <span className="text-zinc-600 dark:text-zinc-300">{estante.nombre}</span>}
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  {[estante.zona_id ? zonaNombre.get(estante.zona_id) : 'Sin zona', plural(estante.cajones.length, 'cajón', 'cajones'), plural(estante.items_count, 'elemento', 'elementos')]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {estante.has_critical_stock && <Badge tone="danger" className="ml-auto">Stock crítico</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
