import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ChevronRight, Layers3, MapPin, Plus } from 'lucide-react';
import type { CajonEntity, Estante, Zona } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { TableSearch } from '@/components/ui/table-search';
import { cn } from '@/lib/cn';
import { plural } from '@/features/mapa-salas/lib/map-labels';
import { buildEstanteGroups, filterEstanteGroups, type GroupKey } from '../lib/estante-groups';
import { CajonRow, type CajonVista } from './cajon-row';

export interface EstantesPanelProps {
  id?: string;
  estantes: Estante[];
  zonas: Zona[];
  cajones: CajonEntity[];
  isLoading: boolean;
  /** Estante desplegado (uno a la vez); lo cambia también tocar un estante en el plano. */
  openKey: GroupKey | null;
  onOpenKeyChange: (key: GroupKey | null) => void;
  /** «Ver todo el estante»: pop-up de contenido del estante (con editar y asignar). */
  onShowEstante: (id: number) => void;
  /** Clic en un cajón: pop-up con sus elementos. */
  onOpenCajon: (cajon: CajonVista) => void;
  onCreateCajon: () => void;
  canMarkFull: boolean;
  cajonCode: (cajon: Pick<CajonEntity, 'barcode' | 'codigo' | 'location'>) => string;
  printingId: number | null;
  onPrint: (cajon: CajonVista) => void;
  onDeleteCajon: (cajon: CajonVista) => void;
  /** Estante a resaltar en el plano mientras el puntero o el foco están en su grupo (`null` al salir). */
  onHighlight: (estanteId: number | null) => void;
  /** Deja sitio a la «X» de la hoja (modos angosto y medio). */
  insetForClose?: boolean;
}

function regionId(key: GroupKey): string {
  return `estante-${key}-cajones`;
}

/**
 * Panel lateral de Ubicaciones (docs/ubicaciones-distribucion.md, decisiones 11–15): solo los estantes de la sala;
 * cada uno se despliega (uno a la vez) y muestra sus cajones con cuántos elementos guardan. Los cajones sin estante
 * van al final. Acoplado como tercera columna o dentro de una hoja; se desplaza por dentro.
 */
export function EstantesPanel({
  id,
  estantes,
  zonas,
  cajones,
  isLoading,
  openKey,
  onOpenKeyChange,
  onShowEstante,
  onOpenCajon,
  onCreateCajon,
  canMarkFull,
  cajonCode,
  printingId,
  onPrint,
  onDeleteCajon,
  onHighlight,
  insetForClose = false,
}: EstantesPanelProps) {
  const [query, setQuery] = useState('');
  const zonaNombre = useMemo(() => new Map(zonas.map((zona) => [zona.id, zona.nombre])), [zonas]);
  const groups = useMemo(() => buildEstanteGroups(estantes, cajones, cajonCode), [estantes, cajones, cajonCode]);
  const visibles = useMemo(() => filterEstanteGroups(groups, query), [groups, query]);
  const searching = query.trim() !== '';

  // Al desplegar un estante desde el plano, llevarlo a la vista dentro del panel.
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (openKey === null) return;
    const header = listRef.current?.querySelector<HTMLElement>(`[data-group="${openKey}"]`);
    header?.scrollIntoView?.({ block: 'nearest' });
  }, [openKey]);

  return (
    <div id={id} className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800',
          insetForClose && 'pr-14',
        )}
      >
        <SectionTitle as="h2" icon={Layers3}>
          Estantes
        </SectionTitle>
        <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400">{estantes.length}</span>
      </div>

      <div className="shrink-0 border-b border-zinc-200 p-2 dark:border-zinc-800">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar estante o cajón…"
          label="Buscar estante o cajón por código o descripción"
          shortcut={false}
          className="w-full sm:min-w-0!"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <SkeletonList label="Cargando estantes…" rows={4} columns={1} />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Esta sala todavía no tiene estantes ni cajones."
            description="Dibuja estantes con «Editar distribución» o pulsa «Nuevo cajón»."
          />
        ) : visibles.length === 0 ? (
          <EmptyState icon={MapPin} title={`Ningún estante o cajón coincide con «${query.trim()}».`} />
        ) : (
          <ul ref={listRef} aria-label="Estantes" className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {visibles.map((group) => {
              const expanded = searching || openKey === group.key;
              const estante = group.estante;
              const codigo = estante?.codigo ?? 'Sin estante';
              const elementos = group.cajones.reduce((sum, cajon) => sum + (cajon.elementos ?? 0), 0);
              const meta = [
                estante ? (estante.zona_id ? zonaNombre.get(estante.zona_id) : 'Sin zona') : null,
                plural(group.cajones.length, 'cajón', 'cajones'),
                plural(estante ? estante.items_count : elementos, 'elemento', 'elementos'),
              ].filter(Boolean);
              const highlight = () => onHighlight(estante?.id ?? null);
              const clear = () => onHighlight(null);
              return (
                <li
                  key={group.key}
                  onPointerEnter={highlight}
                  onPointerLeave={clear}
                  onFocus={highlight}
                  onBlur={clear}
                >
                  <button
                    type="button"
                    data-group={group.key}
                    aria-expanded={expanded}
                    aria-controls={regionId(group.key)}
                    onClick={() => onOpenKeyChange(openKey === group.key ? null : group.key)}
                    className={cn(
                      'flex w-full items-start gap-2 px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent pointer-coarse:py-3',
                      expanded ? 'bg-accent-soft' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
                    )}
                  >
                    <ChevronRight
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-150 dark:text-zinc-400',
                        expanded && 'rotate-90',
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className={cn('text-zinc-900 dark:text-zinc-100', estante && 'font-code')}>{codigo}</span>
                        {estante?.nombre && <span className="truncate text-zinc-600 dark:text-zinc-300">{estante.nombre}</span>}
                        {estante?.has_critical_stock && <Badge tone="danger">Stock crítico</Badge>}
                      </span>
                      <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{meta.join(' · ')}</span>
                    </span>
                  </button>

                  {expanded && (
                    <div id={regionId(group.key)} role="region" aria-label={`Cajones de ${codigo}`} className="border-t border-zinc-200 dark:border-zinc-800">
                      {group.cajones.length === 0 ? (
                        <p className="py-2 pl-7 pr-3 text-[13px] text-zinc-500 dark:text-zinc-400">Este estante no tiene cajones.</p>
                      ) : (
                        <ul aria-label={`Cajones de ${codigo}`} className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {group.cajones.map((cajon) => (
                            <CajonRow
                              key={cajon.id}
                              cajon={cajon}
                              canMarkFull={canMarkFull}
                              printing={printingId === cajon.id}
                              onOpen={onOpenCajon}
                              onPrint={onPrint}
                              onDelete={onDeleteCajon}
                            />
                          ))}
                        </ul>
                      )}
                      {estante && (
                        <div className="border-t border-zinc-200 py-1.5 pl-5 pr-3 dark:border-zinc-800">
                          <Button type="button" variant="ghost" size="sm" onClick={() => onShowEstante(estante.id)}>
                            <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                            Ver todo el estante
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-200 p-2 dark:border-zinc-800">
        <Button type="button" variant="secondary" size="sm" onClick={onCreateCajon} className="w-full">
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          Nuevo cajón
        </Button>
      </div>
    </div>
  );
}

