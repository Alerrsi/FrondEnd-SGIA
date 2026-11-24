import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Archive, MapPin, Plus, X } from 'lucide-react';
import type { CajonEntity, Estante, Zona } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { TableSearch } from '@/components/ui/table-search';
import { cn } from '@/lib/cn';
import { EstantesList } from '@/features/mapa-salas/components/estantes-list';
import { plural } from '@/features/mapa-salas/lib/map-labels';
import { CajonRow } from './cajon-row';

export type PanelTab = 'cajones' | 'estantes';

export interface UbicacionPanelProps {
  id?: string;
  cajones: CajonEntity[];
  isLoadingCajones: boolean;
  estantes: Estante[];
  zonas: Zona[];
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  /** Estante por el que se filtran los cajones (al tocarlo en el plano o en la pestaña Estantes). */
  estanteFilter: number | null;
  onEstanteFilterChange: (id: number | null) => void;
  /** «Ver productos»: abre el pop-up de contenido del estante. */
  onShowContent: (id: number) => void;
  onCreateCajon: () => void;
  canMarkFull: boolean;
  cajonCode: (cajon: CajonEntity) => string;
  printingId: number | null;
  onPrint: (cajon: CajonEntity) => void;
  onDeleteCajon: (cajon: CajonEntity) => void;
  onHighlight: (estanteId: number | null) => void;
  /** Deja sitio a la «X» de la hoja (modos angosto y medio). */
  insetForClose?: boolean;
}

const TAB_CLASS =
  '-mb-px border-b-2 border-transparent px-3 py-2.5 text-[13px] font-medium text-zinc-500 transition-colors duration-150 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 data-[state=active]:border-accent data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 pointer-coarse:py-3';

function cajonEstanteId(cajon: CajonEntity): number | null {
  return cajon.estante_id ?? cajon.estante?.id ?? null;
}

/**
 * Panel lateral de Ubicaciones (docs/ubicaciones-distribucion.md): pestañas Cajones y Estantes. Acoplado como
 * tercera columna en pantallas anchas o dentro de una hoja en las demás; se desplaza por dentro.
 */
export function UbicacionPanel({
  id,
  cajones,
  isLoadingCajones,
  estantes,
  zonas,
  tab,
  onTabChange,
  estanteFilter,
  onEstanteFilterChange,
  onShowContent,
  onCreateCajon,
  canMarkFull,
  cajonCode,
  printingId,
  onPrint,
  onDeleteCajon,
  onHighlight,
  insetForClose = false,
}: UbicacionPanelProps) {
  const [query, setQuery] = useState('');
  const estante = estanteFilter !== null ? (estantes.find((e) => e.id === estanteFilter) ?? null) : null;
  const zonaNombre = estante?.zona_id ? zonas.find((zona) => zona.id === estante.zona_id)?.nombre : undefined;

  const visibles = useMemo(() => {
    const term = query.trim().toLowerCase();
    return cajones.filter((cajon) => {
      if (estanteFilter !== null && cajonEstanteId(cajon) !== estanteFilter) return false;
      if (!term) return true;
      return [cajon.codigo, cajonCode(cajon), cajon.descripcion, cajon.estante?.codigo].some((value) =>
        value?.toLowerCase().includes(term),
      );
    });
  }, [cajones, estanteFilter, query, cajonCode]);

  return (
    <Tabs.Root
      id={id}
      value={tab}
      onValueChange={(value) => onTabChange(value as PanelTab)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <Tabs.List
        aria-label="Contenido de la sala"
        className={cn('flex shrink-0 gap-1 border-b border-zinc-200 px-2 dark:border-zinc-800', insetForClose && 'pr-14')}
      >
        <Tabs.Trigger value="cajones" className={TAB_CLASS}>
          Cajones <span className="font-mono font-normal text-zinc-500 dark:text-zinc-400">{cajones.length}</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="estantes" className={TAB_CLASS}>
          Estantes <span className="font-mono font-normal text-zinc-500 dark:text-zinc-400">{estantes.length}</span>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="cajones" className="flex min-h-0 flex-1 flex-col focus-visible:outline-none">
        {estanteFilter !== null && (
          <div className="flex shrink-0 flex-col gap-2 border-b border-zinc-200 bg-accent-soft/50 px-3 py-2.5 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Estante <span className="font-code">{estante?.codigo ?? ''}</span>
                  {estante?.nombre && <span className="font-normal text-zinc-600 dark:text-zinc-300"> · {estante.nombre}</span>}
                </p>
                {estante && (
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                    {[zonaNombre ?? 'Sin zona', plural(estante.cajones.length, 'cajón', 'cajones'), plural(estante.items_count, 'elemento', 'elementos')].join(' · ')}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onEstanteFilterChange(null)}
                aria-label="Quitar filtro de estante"
                title="Quitar filtro"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => onShowContent(estanteFilter)} className="self-start">
              <Archive aria-hidden="true" className="h-3.5 w-3.5" />
              Ver productos
            </Button>
          </div>
        )}

        <div className="shrink-0 border-b border-zinc-200 p-2 dark:border-zinc-800">
          <TableSearch
            value={query}
            onChange={setQuery}
            placeholder="Filtrar cajones…"
            label="Filtrar cajones por código, estante o descripción"
            shortcut={false}
            className="w-full sm:min-w-0!"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {isLoadingCajones ? (
            <SkeletonList label="Cargando compartimientos…" rows={4} columns={1} />
          ) : cajones.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Esta ubicación no tiene cajones ni gavetas."
              description="Pulsa «Nuevo cajón» para agregar el primero."
            />
          ) : visibles.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title={query.trim() ? `Ningún cajón coincide con «${query.trim()}».` : 'Este estante no tiene cajones.'}
            />
          ) : (
            <ul aria-label="Cajones" className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {visibles.map((cajon) => (
                <CajonRow
                  key={cajon.id}
                  cajon={cajon}
                  code={cajonCode(cajon)}
                  canMarkFull={canMarkFull}
                  printing={printingId === cajon.id}
                  onPrint={onPrint}
                  onDelete={onDeleteCajon}
                  onHighlight={onHighlight}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-zinc-200 p-2 dark:border-zinc-800">
          <Button type="button" variant="secondary" size="sm" onClick={onCreateCajon} className="w-full">
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Nuevo cajón
          </Button>
        </div>
      </Tabs.Content>

      <Tabs.Content value="estantes" className="min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-none">
        <EstantesList
          estantes={estantes}
          zonas={zonas}
          collapsible={false}
          selectedId={estanteFilter}
          onOpen={(e) => {
            onEstanteFilterChange(e.id);
            onTabChange('cajones');
          }}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
}
