import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderTree, Layers, PanelRightClose, PanelRightOpen, Plus, RefreshCw } from 'lucide-react';
import {
  useLocations,
  useDeleteLocation,
  useCajones,
  useDeleteCajon,
  useDownloadCajonLabel,
  useSalaMapa,
} from '@sgia/api-client';
import type { LocationEntity, CajonEntity, Estante } from '@sgia/types';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/toast';
import { apiErrorToMessage } from '@/lib/api-error';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { printBlob } from '@/features/equipos/utils/download';
import { LocationFormDialog } from '@/features/ubicaciones/components/location-form-dialog';
import { CajonFormDialog } from '@/features/ubicaciones/components/cajon-form-dialog';
import { SalasList } from '@/features/ubicaciones/components/salas-list';
import { SalaSelect } from '@/features/ubicaciones/components/sala-select';
import { UbicacionPanel, type PanelTab } from '@/features/ubicaciones/components/ubicacion-panel';
import { usePanelPreference } from '@/features/ubicaciones/hooks/use-panel-preference';
import { cajonFullCode } from '@/features/ubicaciones/lib/location-code';
import { useWorkspaceMode } from '@/features/ubicaciones/hooks/use-workspace-mode';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessRoute, canDo } from '@/features/auth/types/roles';
import { SalaMapaPanel } from '@/features/mapa-salas/components/sala-mapa-panel';
import { useElementSize } from '@/features/mapa-salas/hooks/use-element-size';

const PANEL_ID = 'ubicaciones-panel';
const FRAME_CLASS = 'rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900';

/**
 * Ubicaciones (REQ-05, REQ-22): salas, plano de la sala y panel lateral de cajones y estantes, todo de un vistazo
 * (docs/ubicaciones-distribucion.md). La distribución depende del ancho del área de trabajo (`workspaceMode`).
 */
export default function UbicacionesPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canMarkFull = canDo(role, 'markCajonFull');
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationEntity | null>(null);

  // Distribución según el ancho del área (no de la ventana).
  const workspace = useElementSize<HTMLDivElement>();
  const mode = useWorkspaceMode(workspace.width);
  const docked = mode === 'wide';
  // Desde 1200 px de área las columnas laterales se ensanchan un poco; por debajo, el plano se queda con el resto.
  const roomy = workspace.width >= 1200;

  // Panel lateral: acoplado (recordado) en pantallas anchas; como hoja en las demás.
  const [dockedOpen, setDockedOpen] = usePanelPreference();
  const [sheetOpen, setSheetOpen] = useState(false);
  const panelOpen = docked ? dockedOpen : sheetOpen;
  const [panelTab, setPanelTab] = useState<PanelTab>('cajones');
  const [estanteFilter, setEstanteFilter] = useState<number | null>(null);
  const [hoverEstante, setHoverEstante] = useState<number | null>(null);
  const [contentEstanteId, setContentEstanteId] = useState<number | null>(null);

  // Modales
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationEntity | null>(null);
  const [cajonModalOpen, setCajonModalOpen] = useState(false);
  // Confirmaciones de eliminación (modal estándar en vez del confirm() del navegador).
  const [locationToDelete, setLocationToDelete] = useState<LocationEntity | null>(null);
  const [cajonToDelete, setCajonToDelete] = useState<CajonEntity | null>(null);

  // Queries
  const { data: locationsData, isLoading, refetch } = useLocations({
    search: search.trim() || undefined,
    tipo: tipoFilter || undefined,
  });

  const locations = useMemo(() => locationsData?.data ?? [], [locationsData?.data]);

  // Active location for cajones view
  const activeLocation = useMemo(() => {
    if (selectedLocation) {
      return locations.find((l) => l.id === selectedLocation.id) ?? selectedLocation;
    }
    return locations[0] ?? null;
  }, [selectedLocation, locations]);
  const activeId = activeLocation?.id ?? null;

  const { data: cajonesData, isLoading: isLoadingCajones } = useCajones(
    activeLocation ? { location_id: activeLocation.id } : undefined,
  );

  const cajones: CajonEntity[] = cajonesData?.data ?? [];

  // Estantes y zonas de la sala para la pestaña Estantes (misma consulta que el plano: ya en caché).
  const mapa = useSalaMapa(activeId ?? undefined);
  const estantes = useMemo(() => mapa.data?.estantes ?? [], [mapa.data?.estantes]);
  const zonas = useMemo(() => mapa.data?.zonas ?? [], [mapa.data?.zonas]);

  // Al cambiar de sala, el filtro y los resaltados son de la anterior.
  useEffect(() => {
    setEstanteFilter(null);
    setHoverEstante(null);
    setContentEstanteId(null);
  }, [activeId]);

  // Si la ventana se ensancha con la hoja abierta, el panel pasa a la columna y la hoja se cierra.
  useEffect(() => {
    if (docked) setSheetOpen(false);
  }, [docked]);

  const highlightEstanteIds = useMemo(
    () => [estanteFilter, hoverEstante].filter((id): id is number => id !== null),
    [estanteFilter, hoverEstante],
  );

  // Mutations
  const deleteLocationMutation = useDeleteLocation();
  const deleteCajonMutation = useDeleteCajon();
  const labelMutation = useDownloadCajonLabel();

  const openPanel = useCallback(() => {
    if (docked) setDockedOpen(true);
    else setSheetOpen(true);
  }, [docked, setDockedOpen]);

  const togglePanel = () => {
    if (docked) setDockedOpen(!dockedOpen);
    else setSheetOpen((open) => !open);
  };

  /** Tocar un estante del plano filtra el panel a sus cajones (y lo abre). */
  const handleEstanteClick = useCallback(
    (estante: Estante) => {
      setEstanteFilter(estante.id);
      setPanelTab('cajones');
      openPanel();
    },
    [openPanel],
  );

  const handleShowContent = (id: number) => {
    // Como hoja, el panel se cierra para que el pop-up no quede debajo de otra capa.
    if (!docked) setSheetOpen(false);
    setContentEstanteId(id);
  };

  const handleOpenCreateLocation = () => {
    setEditingLocation(null);
    setLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: LocationEntity) => {
    setEditingLocation(loc);
    setLocationModalOpen(true);
  };

  const handleDeleteLocation = (loc: LocationEntity) => setLocationToDelete(loc);

  const confirmDeleteLocation = async () => {
    const loc = locationToDelete;
    if (!loc) return;
    try {
      await deleteLocationMutation.mutateAsync(loc.id);
      if (selectedLocation?.id === loc.id) {
        setSelectedLocation(null);
      }
      toast.success('Ubicación eliminada');
      setLocationToDelete(null);
    } catch {
      toast.error('Error al eliminar la ubicación');
    }
  };

  const handleOpenCreateCajon = () => {
    if (!activeLocation) return;
    if (!docked) setSheetOpen(false);
    setCajonModalOpen(true);
  };

  /** Código completo del cajón; si la API aún no lo trae, se arma con el de la sala. */
  const cajonCode = useCallback(
    (cajon: CajonEntity) => cajon.barcode || cajonFullCode(cajon.location?.code ?? activeLocation?.code ?? '', cajon.codigo),
    [activeLocation?.code],
  );

  const handlePrintLabel = async (cajon: CajonEntity) => {
    try {
      printBlob(await labelMutation.mutateAsync(cajon.id));
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const handleDeleteCajon = (cajon: CajonEntity) => setCajonToDelete(cajon);

  const confirmDeleteCajon = async () => {
    const cajon = cajonToDelete;
    if (!cajon) return;
    try {
      await deleteCajonMutation.mutateAsync(cajon.id);
      toast.success('Cajón eliminado');
      setCajonToDelete(null);
    } catch {
      toast.error('Error al eliminar el cajón');
    }
  };

  const panel = activeLocation ? (
    <UbicacionPanel
      id={docked ? PANEL_ID : undefined}
      cajones={cajones}
      isLoadingCajones={isLoadingCajones}
      estantes={estantes}
      zonas={zonas}
      tab={panelTab}
      onTabChange={setPanelTab}
      estanteFilter={estanteFilter}
      onEstanteFilterChange={setEstanteFilter}
      onShowContent={handleShowContent}
      onCreateCajon={handleOpenCreateCajon}
      canMarkFull={canMarkFull}
      cajonCode={cajonCode}
      printingId={labelMutation.isPending ? (labelMutation.variables ?? null) : null}
      onPrint={(cajon) => void handlePrintLabel(cajon)}
      onDeleteCajon={handleDeleteCajon}
      onHighlight={setHoverEstante}
      insetForClose={!docked}
    />
  ) : null;

  const panelToggle = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={togglePanel}
      aria-expanded={panelOpen}
      aria-controls={docked && panelOpen ? PANEL_ID : undefined}
    >
      {docked && panelOpen ? (
        <PanelRightClose aria-hidden="true" className="h-4 w-4" />
      ) : (
        <PanelRightOpen aria-hidden="true" className="h-4 w-4" />
      )}
      Cajones <span className="font-mono">({cajones.length})</span>
    </Button>
  );

  const map = activeLocation ? (
    <SalaMapaPanel
      locationId={activeLocation.id}
      variant="embedded"
      canEdit={canDo(role, 'editRoomMap')}
      canSeeInventory={role ? canAccessRoute(role, '/inventario') : false}
      fit={mode === 'stack' ? 'aspect' : 'fill'}
      toolbarActions={panelToggle}
      onEstanteClick={handleEstanteClick}
      highlightEstanteIds={highlightEstanteIds}
      contentEstanteId={contentEstanteId}
      onContentEstanteChange={setContentEstanteId}
      showEstantesList={false}
      className={mode === 'stack' ? undefined : 'flex-1'}
    />
  ) : (
    <EmptyState icon={FolderTree} title="Selecciona o crea una sala para gestionar sus cajones." />
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:gap-6',
        // Medio y ancho: la pantalla ocupa el alto de la ventana (barra de 56 px y margen del marco) y cada columna
        // se desplaza por dentro. En ventanas muy bajas manda el mínimo y la página se desplaza.
        mode !== 'stack' && 'h-[calc(100dvh-6.5rem)] min-h-[560px]',
      )}
    >
      <PageHeader
        icon={Layers}
        title="Gestión de ubicaciones físicas y cajones"
        description="Salas, talleres y bodegas del pañol con los cajones donde se guarda cada producto."
        actions={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              Actualizar
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleOpenCreateLocation}>
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              Nueva sala / pañol
            </Button>
          </>
        }
      />

      <div
        ref={workspace.ref}
        data-mode={mode}
        className={cn('min-w-0', mode === 'stack' ? 'flex flex-col gap-4' : cn('flex min-h-0 flex-1 overflow-hidden', FRAME_CLASS))}
      >
        {mode === 'stack' ? (
          <>
            {activeLocation && locations.length > 0 ? (
              <SalaSelect
                locations={locations}
                active={activeLocation}
                onSelect={setSelectedLocation}
                onEdit={handleOpenEditLocation}
                onDelete={handleDeleteLocation}
              />
            ) : (
              <div className={FRAME_CLASS}>
                <SalasList
                  locations={locations}
                  isLoading={isLoading}
                  activeId={activeId}
                  onSelect={setSelectedLocation}
                  onEdit={handleOpenEditLocation}
                  onDelete={handleDeleteLocation}
                  onCreate={handleOpenCreateLocation}
                  search={search}
                  onSearchChange={setSearch}
                  tipo={tipoFilter}
                  onTipoChange={setTipoFilter}
                />
              </div>
            )}
            {activeLocation && <div className={cn(FRAME_CLASS, 'p-3')}>{map}</div>}
          </>
        ) : (
          <>
            <div className={cn('flex shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800', roomy ? 'w-60' : 'w-52')}>
              <SalasList
                locations={locations}
                isLoading={isLoading}
                activeId={activeId}
                onSelect={setSelectedLocation}
                onEdit={handleOpenEditLocation}
                onDelete={handleDeleteLocation}
                onCreate={handleOpenCreateLocation}
                search={search}
                onSearchChange={setSearch}
                tipo={tipoFilter}
                onTipoChange={setTipoFilter}
              />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4">{map}</div>
            {docked && panelOpen && panel && (
              <aside
                aria-label="Cajones y estantes de la sala"
                className={cn('flex shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800', roomy ? 'w-80' : 'w-72')}
              >
                {panel}
              </aside>
            )}
          </>
        )}
      </div>

      {!docked && (
        <Sheet open={sheetOpen && panel !== null} onOpenChange={setSheetOpen}>
          {sheetOpen && panel && (
            <SheetContent side="right" className="gap-0 sm:max-w-sm!" aria-describedby={undefined}>
              <SheetTitle className="sr-only">Cajones y estantes de «{activeLocation?.nombre}»</SheetTitle>
              {panel}
            </SheetContent>
          )}
        </Sheet>
      )}

      <LocationFormDialog
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        location={editingLocation}
      />

      {activeLocation && (
        <CajonFormDialog
          open={cajonModalOpen}
          onClose={() => setCajonModalOpen(false)}
          location={activeLocation}
        />
      )}

      <ConfirmDialog
        open={locationToDelete !== null}
        title="Eliminar ubicación"
        description={`¿Eliminar la ubicación «${locationToDelete?.nombre ?? ''}» y sus cajones asociados? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteLocationMutation.isPending}
        onConfirm={() => void confirmDeleteLocation()}
        onCancel={() => setLocationToDelete(null)}
      />

      <ConfirmDialog
        open={cajonToDelete !== null}
        title="Eliminar cajón"
        description={`¿Eliminar el compartimiento «${cajonToDelete?.codigo ?? ''}»? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteCajonMutation.isPending}
        onConfirm={() => void confirmDeleteCajon()}
        onCancel={() => setCajonToDelete(null)}
      />
    </div>
  );
}
