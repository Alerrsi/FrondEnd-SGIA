import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';
import {
  useLocations,
  usePrefetchEstanteContenido,
  useSalaMapa,
  useUpdateEstante,
  useUpdateZona,
} from '@sgia/api-client';
import type { Estante, EstanteRotation, Zona } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessRoute, canDo } from '@/features/auth/types/roles';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { AsignarCajonesDialog } from '../components/asignar-cajones-dialog';
import { EstanteContenidoDialog } from '../components/estante-contenido-dialog';
import { EstanteFormDialog } from '../components/estante-form-dialog';
import { EstanteShape } from '../components/estante-shape';
import { EstantesList } from '../components/estantes-list';
import { MapGridPattern } from '../components/map-grid-pattern';
import { MapNotice } from '../components/map-notice';
import { MapaToolbar } from '../components/mapa-toolbar';
import { MovePad } from '../components/move-pad';
import { SalaDimensionesDialog } from '../components/sala-dimensiones-dialog';
import { SalaSelector } from '../components/sala-selector';
import { SalaSearch } from '../components/sala-search';
import { SalaSvg } from '../components/sala-svg';
import { ZonaFormDialog } from '../components/zona-form-dialog';
import { ZoomControls } from '../components/zoom-controls';
import { applyZonaRect, ZonaShape } from '../components/zona-shape';
import { useEstanteKeyboard } from '../hooks/use-estante-keyboard';
import { useLastSala } from '../hooks/use-last-sala';
import { useMapScale } from '../hooks/use-map-scale';
import { useMapViewport } from '../hooks/use-map-viewport';
import { useSalaSearch } from '../hooks/use-sala-search';
import { useSvgDrag } from '../hooks/use-svg-drag';
import {
  center,
  contains,
  estanteRect,
  occupiedRect,
  placementError,
  roomRect,
  snap,
  zonaAt,
  zonaLabelAtBottom,
  zonaRect,
  type Rect,
} from '../lib/map-geometry';
import { plural } from '../lib/map-labels';

const ZONE_LABEL_PX = 13;
const ZONE_MIN_CM = 50;

function applyEstanteRect(element: SVGGElement, rect: Rect, invalid: boolean) {
  element.setAttribute('transform', `translate(${rect.x} ${rect.y})`);
  element.dataset.invalid = String(invalid);
}

/** Plano de una sala (REQ-22): muro, zonas y estantes; pulsar un estante muestra lo que guarda. PAN-01 y DIR-01 lo editan. */
export default function MapaSalaPage() {
  const { locationId } = useParams();
  const salaId = Number(locationId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const canSeeInventory = role ? canAccessRoute(role, '/inventario') : false;
  const canEdit = canDo(role, 'editRoomMap');

  const salas = useLocations({ per_page: 100 });
  const mapa = useSalaMapa(Number.isInteger(salaId) && salaId > 0 ? salaId : undefined);
  const { remember } = useLastSala();
  const prefetch = usePrefetchEstanteContenido();
  const updateEstante = useUpdateEstante();
  const updateZona = useUpdateZona();

  const svgRef = useRef<SVGSVGElement>(null);
  const width = mapa.data?.location.map_width_cm ?? 1000;
  const height = mapa.data?.location.map_height_cm ?? 600;
  const room = useMemo(() => roomRect(width, height), [width, height]);
  const viewport = useMapViewport(svgRef, width, height);
  const pxPerCm = useMapScale(svgRef, viewport.view.w);
  const startDrag = useSvgDrag(svgRef);

  const [openId, setOpenId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [estanteForm, setEstanteForm] = useState<{ open: boolean; estante: Estante | null }>({ open: false, estante: null });
  const [zonaForm, setZonaForm] = useState<{ open: boolean; zona: Zona | null }>({ open: false, zona: null });
  const [dimsOpen, setDimsOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<Estante | null>(null);

  const estantes = useMemo(() => mapa.data?.estantes ?? [], [mapa.data?.estantes]);
  const zonas = useMemo(() => mapa.data?.zonas ?? [], [mapa.data?.zonas]);
  const [searchTerm, setSearchTerm] = useState('');
  const search = useSalaSearch(salaId, estantes, searchTerm);

  useEffect(() => {
    if (mapa.data) remember(mapa.data.location.id);
  }, [mapa.data, remember]);

  useEffect(() => {
    setEditing(false);
    setSelectedId(null);
    setOpenId(null);
    setSearchTerm('');
  }, [salaId]);

  const zonaNombre = useMemo(() => new Map(zonas.map((zona) => [zona.id, zona.nombre])), [zonas]);

  const savePosition = useCallback(
    (estante: Estante, x: number, y: number, rotation: EstanteRotation) => {
      const zona = zonaAt(center(occupiedRect(x, y, estante.width, estante.depth, rotation)), zonas);
      updateEstante.mutate(
        { id: estante.id, locationId: estante.location_id, payload: { x, y, rotation, zona_id: zona?.id ?? null } },
        { onError: (error) => toast.error(apiErrorToMessage(error)) },
      );
    },
    [updateEstante, zonas],
  );

  const keyboard = useEstanteKeyboard({
    estantes,
    room,
    onSave: (estante, draft) => savePosition(estante, draft.x, draft.y, draft.rotation),
    onInvalid: (reason) => toast.error(reason),
    onDeselect: () => setSelectedId(null),
  });

  const openEstante = useCallback((estante: Estante) => setOpenId(estante.id), []);
  const prefetchEstante = useCallback((id: number) => void prefetch(id), [prefetch]);

  const handleEstanteDrag = useCallback(
    (event: PointerEvent<SVGGElement>, estante: Estante) => {
      setSelectedId(estante.id);
      startDrag(event, {
        element: event.currentTarget,
        origin: estanteRect(estante),
        mode: 'move',
        apply: applyEstanteRect,
        snapRect: (rect) => ({ ...rect, x: snap(rect.x), y: snap(rect.y) }),
        validate: (rect) => placementError(rect, room, estantes, estante.id),
        onCommit: (rect) => savePosition(estante, rect.x, rect.y, estante.rotation),
        onInvalidDrop: (reason) => toast.error(reason),
        onClick: () => setOpenId(estante.id),
      });
    },
    [startDrag, room, estantes, savePosition],
  );

  const handleZonaDrag = useCallback(
    (event: PointerEvent<SVGGElement>, zona: Zona, mode: 'move' | 'resize') => {
      const element = (event.currentTarget.closest('[data-zona-id]') ?? event.currentTarget) as SVGGElement;
      startDrag(event, {
        element,
        origin: zonaRect(zona),
        mode,
        minSize: ZONE_MIN_CM,
        apply: applyZonaRect,
        snapRect: (rect) =>
          mode === 'move'
            ? { ...rect, x: snap(rect.x), y: snap(rect.y) }
            : { ...rect, w: Math.max(ZONE_MIN_CM, snap(rect.w)), h: Math.max(ZONE_MIN_CM, snap(rect.h)) },
        validate: (rect) => (contains(room, rect) ? null : 'La zona queda fuera de la sala.'),
        onCommit: (rect) =>
          updateZona.mutate(
            { id: zona.id, locationId: zona.location_id, payload: { x: rect.x, y: rect.y, width: rect.w, depth: rect.h } },
            { onError: (error) => toast.error(apiErrorToMessage(error)) },
          ),
        onInvalidDrop: (reason) => toast.error(reason),
      });
    },
    [startDrag, room, updateZona],
  );

  const editZona = useCallback((zona: Zona) => setZonaForm({ open: true, zona }), []);

  const sala = mapa.data?.location;
  const openEstanteData = estantes.find((estante) => estante.id === openId) ?? null;
  const selected = editing ? (estantes.find((estante) => estante.id === selectedId) ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={MapIcon}
        title="Mapa de salas"
        description={sala ? `${sala.code} · ${sala.nombre}: pulsa un estante para ver lo que guarda.` : 'Distribución de zonas y estantes de cada sala.'}
        actions={
          salas.data && salas.data.data.length > 0 ? (
            <SalaSelector salas={salas.data.data} value={salaId} onChange={(id) => navigate(`/mapa-salas/${id}`)} />
          ) : undefined
        }
      />

      {mapa.isLoading && <Skeleton label="Cargando el plano de la sala" className="aspect-[5/3] w-full" />}

      {mapa.isError && (
        <ErrorState action={<Button size="sm" variant="secondary" onClick={() => void mapa.refetch()}>Reintentar</Button>}>
          {apiErrorToMessage(mapa.error)}
        </ErrorState>
      )}

      {mapa.data && sala && (
        <>
          <MapaToolbar
            canEdit={canEdit}
            editing={editing}
            onToggleEdit={() => {
              setEditing((value) => !value);
              setSelectedId(null);
            }}
            onNewEstante={() => setEstanteForm({ open: true, estante: null })}
            onNewZona={() => setZonaForm({ open: true, zona: null })}
            onDimensions={() => setDimsOpen(true)}
          >
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

          {!sala.has_dimensions && (
            <MapNotice
              action={canEdit ? <Button size="sm" variant="secondary" onClick={() => setDimsOpen(true)}>Definir medidas</Button> : undefined}
            >
              Esta sala aún no tiene medidas: el plano usa 10 × 6 m.
            </MapNotice>
          )}
          {canEdit && mapa.data.cajones_sin_estante_count > 0 && (
            <MapNotice>
              {plural(mapa.data.cajones_sin_estante_count, 'cajón sin estante', 'cajones sin estante')}. Asígnalos desde el
              pop-up de un estante con «Asignar cajones».
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
              className={cn('mx-auto block h-auto max-h-[70vh] w-full touch-pan-y select-none', viewport.zoom > 1 && 'cursor-grab touch-none')}
              background={
                <>
                  {editing && <MapGridPattern width={width} height={height} />}
                  {zonas.map((zona) => (
                    <ZonaShape
                      key={zona.id}
                      zona={zona}
                      fontSize={ZONE_LABEL_PX / pxPerCm}
                      editable={editing}
                      handleSize={14 / pxPerCm}
                      onDragStart={handleZonaDrag}
                      onEdit={editZona}
                      labelAtBottom={zonaLabelAtBottom(zona, estantes, ZONE_LABEL_PX / pxPerCm)}
                    />
                  ))}
                </>
              }
            >
              {estantes.map((estante) => {
                const draft = keyboard.draft?.id === estante.id ? keyboard.draft : null;
                const shown = draft ? { ...estante, x: draft.x, y: draft.y, rotation: draft.rotation } : estante;
                return (
                  <EstanteShape
                    key={estante.id}
                    estante={shown}
                    zonaNombre={estante.zona_id ? (zonaNombre.get(estante.zona_id) ?? null) : null}
                    pxPerCm={pxPerCm}
                    selected={editing ? estante.id === selectedId : estante.id === openId}
                    marked={search.marked.has(estante.id)}
                    editable={editing}
                    onActivate={openEstante}
                    onPrefetch={prefetchEstante}
                    onDragStart={handleEstanteDrag}
                    onEditKey={editing ? keyboard.handleKey : undefined}
                  />
                );
              })}
            </SalaSvg>
          </div>

          {editing && (
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
              Arrastra estantes y zonas; se guardan al soltar. Con un estante enfocado: flechas mueven 10 cm (con Shift, 50 cm) y R lo gira. Doble clic en una zona para editarla.
            </p>
          )}
          {selected && (
            <MovePad
              codigo={selected.codigo}
              onMove={(dx, dy) => keyboard.nudge(selected, dx, dy)}
              onRotate={() => keyboard.rotate(selected)}
            />
          )}

          <EstantesList estantes={estantes} zonas={zonas} onOpen={openEstante} />
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
                setEstanteForm({ open: true, estante: openEstanteData });
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

      {canEdit && sala && (
        <>
          <EstanteFormDialog
            open={estanteForm.open}
            onClose={() => setEstanteForm({ open: false, estante: null })}
            locationId={sala.id}
            zonas={zonas}
            estante={estanteForm.estante}
            onCreated={(created) => {
              setEditing(true);
              setSelectedId(created.id);
            }}
          />
          <ZonaFormDialog
            open={zonaForm.open}
            onClose={() => setZonaForm({ open: false, zona: null })}
            locationId={sala.id}
            room={{ width, height }}
            zonas={zonas}
            zona={zonaForm.zona}
          />
          <SalaDimensionesDialog
            open={dimsOpen}
            onClose={() => setDimsOpen(false)}
            locationId={sala.id}
            nombre={sala.nombre}
            widthCm={width}
            heightCm={height}
          />
          <AsignarCajonesDialog
            open={assignFor !== null}
            onClose={() => setAssignFor(null)}
            locationId={sala.id}
            estante={assignFor}
          />
        </>
      )}
    </div>
  );
}
