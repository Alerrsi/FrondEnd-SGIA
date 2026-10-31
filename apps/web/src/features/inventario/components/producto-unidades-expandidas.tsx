import { useProductUnits } from '@sgia/api-client';
import type { Producto } from '@sgia/types';
import { Loader2, MapPin } from 'lucide-react';

import { apiErrorToMessage } from '@/lib/api-error';

import { UnidadStatusBadge } from './unidad-status-badge';

const MAX_UNITS = 100;

/** Lista de solo lectura con todas las instancias (hijas) de un producto equipo/maqueta. */
export function ProductoUnidadesExpandidas({ producto }: { producto: Producto }) {
  const { data, isLoading, isError, error } = useProductUnits(producto.id, {
    per_page: MAX_UNITS,
  });
  const units = data?.data ?? [];
  const total = data?.meta.total ?? units.length;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 font-mono text-xs text-zinc-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Cargando instancias…
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
        {apiErrorToMessage(error)}
      </p>
    );
  }

  if (units.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
        Este producto no tiene instancias registradas.
      </p>
    );
  }

  return (
    <div className="px-4 py-2">
      <table className="w-full text-left text-xs" aria-label={`Instancias de ${producto.nombre}`}>
        <thead>
          <tr className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <th className="py-1 pr-3 font-medium">Código</th>
            <th className="py-1 pr-3 font-medium">Serie</th>
            <th className="py-1 pr-3 font-medium">Ubicación</th>
            <th className="py-1 pr-3 font-medium">Estado</th>
            <th className="py-1 font-medium">Préstamo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {units.map((unit) => {
            const sala = unit.cajon?.location?.nombre ?? unit.cajon?.location?.sala;
            return (
              <tr key={unit.id}>
                <td className="py-1.5 pr-3">
                  <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
                    {unit.code}
                  </span>
                </td>
                <td className="py-1.5 pr-3 font-mono text-zinc-600 dark:text-zinc-400">
                  {unit.serial_number || '—'}
                </td>
                <td className="py-1.5 pr-3 font-mono text-zinc-600 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                    {sala ? `${sala} · ` : ''}
                    {unit.cajon?.codigo ?? 'Sin cajón'}
                  </span>
                </td>
                <td className="py-1.5 pr-3">
                  <UnidadStatusBadge status={unit.status} />
                </td>
                <td className="py-1.5 font-mono text-zinc-500">
                  {unit.active_loan?.code ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {total > units.length && (
        <p className="pt-1 font-mono text-[11px] text-zinc-500">
          Mostrando {units.length} de {total}. Abre el detalle para ver todas.
        </p>
      )}
    </div>
  );
}
