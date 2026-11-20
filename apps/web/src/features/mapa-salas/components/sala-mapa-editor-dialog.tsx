import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { LayoutGrid, Plus, Ruler } from 'lucide-react';
import { useUpdateEstante, useUpdateZona } from '@sgia/api-client';
import type { Estante, EstanteRotation, SalaMapa, Zona } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { useEstanteKeyboard } from '../hooks/use-estante-keyboard';
import { useMapScale } from '../hooks/use-map-scale';
import { useMapViewport } from '../hooks/use-map-viewport';
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
import { AsignarCajonesDialog } from './asignar-cajones-dialog';
import { EstanteContenidoDialog } from './estante-contenido-dialog';
import { EstanteFormDialog } from './estante-form-dialog';
import { EstanteShape } from './estante-shape';
import { MapGridPattern } from './map-grid-pattern';
import { MapNotice } from './map-notice';
import { MapaToolbar } from './mapa-toolbar';
import { MovePad } from './move-pad';
import { SalaDimensionesDialog } from './sala-dimensiones-dialog';
import { SalaSvg } from './sala-svg';
import { ZonaFormDialog } from './zona-form-dialog';
import { applyZonaRect, ZonaShape } from './zona-shape';
import { ZoomControls } from './zoom-controls';

const ZONE_LABEL_PX = 13;
const ZONE_MIN_CM = 50;

function applyEstanteRect(element: SVGGElement, rect: Rect, invalid: boolean) {
  element.setAttribute('transform', `translate(${rect.x} ${rect.y})`);
  element.dataset.invalid = String(invalid);
}

export interface SalaMapaEditorDialogProps {
  open: boolean;
  onClose: () => void;
  mapa: SalaMapa;
  canSeeInventory: boolean;
  /** Estante seleccionado al abrir (p. ej. el recién creado). */
  initialSelectedId?: number | null;
}

/**
 * Edición del plano en un modal (REQ-22 fase 6): rejilla, arrastre de estantes y zonas, teclado, `MovePad`,
 * crear/editar estantes y zonas, medidas y cajones. Cada cambio se guarda al soltar; «Listo» cierra.
 */
export function SalaMapaEditorDialog({ open, onClose, mapa, canSeeInventory, initialSelectedId = null }: SalaMapaEditorDialogProps) {
  const sala = mapa.location;
  const width = sala.map_width_cm;
  const height = sala.map_height_cm;
  const estantes = mapa.estantes;
  const zonas = mapa.zonas;

  const svgRef = useRef<SVGSVGElement>(null);
  const viewport = useMapViewport(svgRef, width, height);
  const pxPerCm = useMapScale(svgRef, viewport.view.w);
  const startDrag = useSvgDrag(svgRef);
  const updateEstante = useUpdateEstante();
  const updateZona = useUpdateZona();
  const room = useMemo(() => roomRect(width, height), [width, height]);

  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const [openId, setOpenId] = useState<number | null>(null);
  const [estanteForm, setEstanteForm] = useState<{ open: boolean; estante: Estante | null }>({ open: false, estante: null });
  const [zonaForm, setZonaForm] = useState<{ open: boolean; zona: Zona | null }>({ open: false, zona: null });
  const [dimsOpen, setDimsOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<Estante | null>(null);

  useEffect(() => {
    if (open) setSelectedId(initialSelectedId);
  }, [open, initialSelectedId]);

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

  // Cerrar (Listo, X, Escape o clic afuera) guarda un movimiento de teclado que aún esperaba.
  const handleClose = () => {
    keyboard.flush();
    setSelectedId(null);
    onClose();
  };
  const openEstante = useCallback((estante: Estante) => setOpenId(estante.id), []);

  /** `Escape`: primero cancela un arrastre o quita la selección; solo después cierra el modal. */
  const handleEscape = (event: KeyboardEvent) => {
    if (svgRef.current?.querySelector('[data-dragging="true"]')) {
      event.preventDefault();
      return;
    }
    if (selectedId !== null) {
      event.preventDefault();
      setSelectedId(null);
    }
  };

  const selected = estantes.find((estante) => estante.id === selectedId) ?? null;
  const openEstanteData = estantes.find((estante) => estante.id === openId) ?? null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        size="2xl"
        title={`Editar distribución · ${sala.code}`}
        description={`${sala.nombre}: los cambios se guardan al soltar.`}
        onEscapeKeyDown={handleEscape}
      >
        <div className="flex flex-col gap-3">
          <MapaToolbar
            actions={
              <>
                <Button size="sm" variant="secondary" onClick={() => setDimsOpen(true)}>
                  <Ruler aria-hidden="true" className="h-4 w-4" /> Medidas
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setZonaForm({ open: true, zona: null })}>
                  <LayoutGrid aria-hidden="true" className="h-4 w-4" /> Nueva zona
                </Button>
                <Button size="sm" variant="primary" onClick={() => setEstanteForm({ open: true, estante: null })}>
                  <Plus aria-hidden="true" className="h-4 w-4" /> Nuevo estante
                </Button>
              </>
            }
          >
            <ZoomControls
              zoom={viewport.zoom}
              canZoomIn={viewport.canZoomIn}
              canZoomOut={viewport.canZoomOut}
              onZoomIn={viewport.zoomIn}
              onZoomOut={viewport.zoomOut}
              onFit={viewport.fit}
            />
          </MapaToolbar>

          {!sala.has_dimensions && (
            <MapNotice action={<Button size="sm" variant="secondary" onClick={() => setDimsOpen(true)}>Definir medidas</Button>}>
              Esta sala aún no tiene medidas: el plano usa 10 × 6 m.
            </MapNotice>
          )}
          {mapa.cajones_sin_estante_count > 0 && (
            <MapNotice>
              {plural(mapa.cajones_sin_estante_count, 'cajón sin estante', 'cajones sin estante')}. Pulsa un estante y elige
              «Asignar cajones».
            </MapNotice>
          )}

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
            <SalaSvg
              ref={svgRef}
              label={`${sala.nombre} (edición)`}
              width={width}
              height={height}
              viewBox={viewport.view}
              pxPerCm={pxPerCm}
              onPointerDown={viewport.onPanStart}
              className={cn('mx-auto block h-auto max-h-[60vh] w-full select-none', viewport.zoom > 1 && 'cursor-grab touch-none')}
              background={
                <>
                  <MapGridPattern width={width} height={height} />
                  {zonas.map((zona) => (
                    <ZonaShape
                      key={zona.id}
                      zona={zona}
                      fontSize={ZONE_LABEL_PX / pxPerCm}
                      editable
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
                    selected={estante.id === selectedId}
                    editable
                    onActivate={openEstante}
                    onDragStart={handleEstanteDrag}
                    onEditKey={keyboard.handleKey}
                  />
                );
              })}
            </SalaSvg>
          </div>

          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
            Arrastra estantes y zonas. Con un estante enfocado: flechas mueven 10 cm (con Shift, 50 cm) y R lo gira. Doble
            clic en una zona para editarla; pulsa un estante sin moverlo para ver su contenido.
          </p>
          {selected && (
            <MovePad codigo={selected.codigo} onMove={(dx, dy) => keyboard.nudge(selected, dx, dy)} onRotate={() => keyboard.rotate(selected)} />
          )}

          <DialogFooter>
            <DialogCloseButton>Listo</DialogCloseButton>
          </DialogFooter>
        </div>

        <EstanteContenidoDialog
          estanteId={openId}
          codigo={openEstanteData?.codigo}
          onClose={() => setOpenId(null)}
          canSeeInventory={canSeeInventory}
          onEdit={
            openEstanteData
              ? () => {
                  setOpenId(null);
                  setEstanteForm({ open: true, estante: openEstanteData });
                }
              : undefined
          }
          onAssign={
            openEstanteData
              ? () => {
                  setOpenId(null);
                  setAssignFor(openEstanteData);
                }
              : undefined
          }
        />
        <EstanteFormDialog
          open={estanteForm.open}
          onClose={() => setEstanteForm({ open: false, estante: null })}
          locationId={sala.id}
          zonas={zonas}
          estante={estanteForm.estante}
          onCreated={(created) => setSelectedId(created.id)}
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
        <AsignarCajonesDialog open={assignFor !== null} onClose={() => setAssignFor(null)} locationId={sala.id} estante={assignFor} />
      </Dialog>
    </>
  );
}
