import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Pencil } from 'lucide-react';
import { usePrefetchEstanteContenido, useSalaMapa } from '@sgia/api-client';
import type { Estante } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { useMapScale } from '../hooks/use-map-scale';
import { useMapViewport } from '../hooks/use-map-viewport';
import { useSalaSearch } from '../hooks/use-sala-search';
import { zonaLabelAtBottom } from '../lib/map-geometry';
import { plural } from '../lib/map-labels';
import { AsignarCajonesDialog } from './asignar-cajones-dialog';
import { EstanteContenidoDialog } from './estante-contenido-dialog';
import { EstanteFormDialog } from './estante-form-dialog';
import { EstanteShape } from './estante-shape';
import { EstantesList } from './estantes-list';
import { MapNotice } from './map-notice';
import { MapaToolbar } from './mapa-toolbar';
import { SalaMapaEditorDialog } from './sala-mapa-editor-dialog';
import { SalaSearch } from './sala-search';
import { SalaSvg } from './sala-svg';
import { ZonaShape } from './zona-shape';
import { ZoomControls } from './zoom-controls';

const ZONE_LABEL_PX = 13;

export interface SalaMapaPanelProps {
  locationId: number;
  /** `PAN-01` y `DIR-01`: «Editar distribución» abre el modal de edición. */
  canEdit: boolean;
  /** `PAN-01` y `DIR-01`: «Ver en inventario» en el pop-up. */
  canSeeInventory: boolean;
  /** `page`: pantalla `/mapa-salas`. `embedded`: celda de Ubicaciones, con título propio y menos alto. */
  variant?: 'page' | 'embedded';
  /** Avisa cuál es la sala dibujada (para recordarla). */
  onLoaded?: (locationId: number) => void;
}

/**
 * Plano de una sala para mirar (REQ-22): zoom, «Buscar en la sala», pop-up de cada estante y lista alternativa.
 * La edición va en `SalaMapaEditorDialog`.
 */
export function SalaMapaPanel({ locationId, canEdit, canSeeInventory, variant = 'page', onLoaded }: SalaMapaPanelProps) {
  const mapa = useSalaMapa(locationId > 0 ? locationId : undefined);
  const prefetch = usePrefetchEstanteContenido();
  const svgRef = useRef<SVGSVGElement>(null);
  const width = mapa.data?.location.map_width_cm ?? 1000;
  const height = mapa.data?.location.map_height_cm ?? 600;
  const viewport = useMapViewport(svgRef, width, height);
  const pxPerCm = useMapScale(svgRef, viewport.view.w);

  const estantes = useMemo(() => mapa.data?.estantes ?? [], [mapa.data?.estantes]);
  const zonas = useMemo(() => mapa.data?.zonas ?? [], [mapa.data?.zonas]);
  const [searchTerm, setSearchTerm] = useState('');
  const search = useSalaSearch(locationId, estantes, searchTerm);

  const [openId, setOpenId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editEstante, setEditEstante] = useState<Estante | null>(null);
  const [assignFor, setAssignFor] = useState<Estante | null>(null);

  useEffect(() => {
    setOpenId(null);
    setEditorOpen(false);
    setSearchTerm('');
  }, [locationId]);

  const loadedId = mapa.data?.location.id;
  useEffect(() => {
    if (loadedId) onLoaded?.(loadedId);
  }, [loadedId, onLoaded]);

  const zonaNombre = useMemo(() => new Map(zonas.map((zona) => [zona.id, zona.nombre])), [zonas]);
  const openEstante = useCallback((estante: Estante) => setOpenId(estante.id), []);
  const prefetchEstante = useCallback((id: number) => void prefetch(id), [prefetch]);

  const sala = mapa.data?.location;
  const openEstanteData = estantes.find((estante) => estante.id === openId) ?? null;
  const embedded = variant === 'embedded';

  const editButton = canEdit && sala ? (
    <Button size="sm" variant={embedded ? 'secondary' : 'primary'} onClick={() => setEditorOpen(true)}>
      <Pencil aria-hidden="true" className="h-4 w-4" />
      Editar distribución
    </Button>
  ) : undefined;

  return (
    <section aria-label={sala ? `Mapa de ${sala.nombre}` : 'Mapa de la sala'} className="flex min-w-0 flex-col gap-3">
      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle as="h2" icon={MapIcon} className="min-w-0">
            <span className="truncate">{sala ? `Mapa de «${sala.nombre}»` : 'Mapa de la sala'}</span>
          </SectionTitle>
          {editButton}
        </div>
      )}

      {mapa.isLoading && <Skeleton label="Cargando el plano de la sala" className="aspect-[5/3] w-full" />}
      {mapa.isError && (
        <ErrorState action={<Button size="sm" variant="secondary" onClick={() => void mapa.refetch()}>Reintentar</Button>}>
          {apiErrorToMessage(mapa.error)}
        </ErrorState>
      )}

      {mapa.data && sala && (
        <>
          <MapaToolbar actions={embedded ? undefined : editButton}>
            <ZoomControls
              zoom={viewport.zoom}
              canZoomIn={viewport.canZoomIn}
              canZoomOut={viewport.canZoomOut}
              onZoomIn={viewport.zoomIn}
              onZoomOut={viewport.zoomOut}
              onFit={viewport.fit}
            />
            <SalaSearch
              value={searchTerm}
              onChange={setSearchTerm}
              active={search.active}
              matches={search.marked.size}
              isSearching={search.isSearching}
            />
          </MapaToolbar>

          {!sala.has_dimensions && <MapNotice>Esta sala aún no tiene medidas: el plano usa 10 × 6 m.</MapNotice>}
          {canEdit && mapa.data.cajones_sin_estante_count > 0 && (
            <MapNotice action={<Button size="sm" variant="secondary" onClick={() => setEditorOpen(true)}>Asignar</Button>}>
              {plural(mapa.data.cajones_sin_estante_count, 'cajón sin estante', 'cajones sin estante')}.
            </MapNotice>
          )}

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:p-4">
            <SalaSvg
              ref={svgRef}
              label={sala.nombre}
              width={width}
              height={height}
              viewBox={viewport.view}
              pxPerCm={pxPerCm}
              onPointerDown={viewport.onPanStart}
              className={cn(
                'mx-auto block h-auto w-full touch-pan-y select-none',
                embedded ? 'max-h-[55vh]' : 'max-h-[70vh]',
                viewport.zoom > 1 && 'cursor-grab touch-none',
              )}
              background={zonas.map((zona) => (
                <ZonaShape
                  key={zona.id}
                  zona={zona}
                  fontSize={ZONE_LABEL_PX / pxPerCm}
                  labelAtBottom={zonaLabelAtBottom(zona, estantes, ZONE_LABEL_PX / pxPerCm)}
                />
              ))}
            >
              {estantes.map((estante) => (
                <EstanteShape
                  key={estante.id}
                  estante={estante}
                  zonaNombre={estante.zona_id ? (zonaNombre.get(estante.zona_id) ?? null) : null}
                  pxPerCm={pxPerCm}
                  selected={estante.id === openId}
                  marked={search.marked.has(estante.id)}
                  onActivate={openEstante}
                  onPrefetch={prefetchEstante}
                />
              ))}
            </SalaSvg>
          </div>

          <EstantesList estantes={estantes} zonas={zonas} onOpen={openEstante} />

          {canEdit && (
            <>
              <SalaMapaEditorDialog open={editorOpen} onClose={() => setEditorOpen(false)} mapa={mapa.data} canSeeInventory={canSeeInventory} />
              <EstanteFormDialog
                open={editEstante !== null}
                onClose={() => setEditEstante(null)}
                locationId={sala.id}
                zonas={zonas}
                estante={editEstante}
              />
              <AsignarCajonesDialog open={assignFor !== null} onClose={() => setAssignFor(null)} locationId={sala.id} estante={assignFor} />
            </>
          )}
        </>
      )}

      <EstanteContenidoDialog
        estanteId={openId}
        codigo={openEstanteData?.codigo}
        onClose={() => setOpenId(null)}
        canSeeInventory={canSeeInventory}
        onEdit={
          canEdit && openEstanteData
            ? () => {
                setOpenId(null);
                setEditEstante(openEstanteData);
              }
            : undefined
        }
        onAssign={
          canEdit && openEstanteData
            ? () => {
                setOpenId(null);
                setAssignFor(openEstanteData);
              }
            : undefined
        }
      />
    </section>
  );
}
