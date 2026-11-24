import type { EstanteContenidoProducto, EstanteContenidoUnidades } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { plural } from '../lib/map-labels';

function UnidadesBadges({ unidades }: { unidades: EstanteContenidoUnidades }) {
  const { disponible, prestado, en_reparacion } = unidades.by_status;
  return (
    <span className="flex flex-wrap justify-end gap-1">
      {disponible > 0 && <Badge tone="available">{plural(disponible, 'disponible', 'disponibles')}</Badge>}
      {prestado > 0 && <Badge tone="loaned">{plural(prestado, 'prestado', 'prestados')}</Badge>}
      {en_reparacion > 0 && <Badge tone="maintenance">{`${en_reparacion} en reparación`}</Badge>}
    </span>
  );
}

export interface CajonElementosProps {
  productos: EstanteContenidoProducto[];
  unidades: EstanteContenidoUnidades[];
}

/** Elementos de un cajón: productos con su cantidad y equipos/maquetas con sus unidades por estado. */
export function CajonElementos({ productos, unidades }: CajonElementosProps) {
  if (productos.length === 0 && unidades.length === 0) {
    return <p className="px-3 py-2 text-[13px] text-zinc-500 dark:text-zinc-400">Cajón vacío.</p>;
  }
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {productos.map((producto) => (
        <li key={`p-${producto.id}`} className="flex items-center gap-3 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 text-zinc-900 dark:text-zinc-100">{producto.name}</span>
          {producto.is_critical && <Badge tone="danger">Bajo el mínimo</Badge>}
          <span className="font-mono text-[13px] text-zinc-600 dark:text-zinc-300">{producto.quantity} u.</span>
        </li>
      ))}
      {unidades.map((grupo) => (
        <li key={`u-${grupo.product_id}`} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 text-zinc-900 dark:text-zinc-100">
            {grupo.product_name}
            <span className="ml-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
              {grupo.type === 'maqueta' ? 'Maqueta' : 'Equipo'}
            </span>
          </span>
          <UnidadesBadges unidades={grupo} />
        </li>
      ))}
    </ul>
  );
}
