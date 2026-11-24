import { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Building2,
  FolderTree,
  Trash2,
  Edit2,
  Loader2,
  MapPin,
  Printer,
  RefreshCw,
} from 'lucide-react';
import {
  useLocations,
  useDeleteLocation,
  useCajones,
  useDeleteCajon,
  useDownloadCajonLabel,
} from '@sgia/api-client';
import type { LocationEntity, CajonEntity } from '@sgia/types';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/toast';
import { apiErrorToMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { PageHeader } from '@/components/ui/page-header';
import { SectionTitle } from '@/components/ui/section-title';
import { ICON_BUTTON_CLASS } from '@/components/ui/table-styles';
import { TableSearch } from '@/components/ui/table-search';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { CODE_CHIP_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { printBlob } from '@/features/equipos/utils/download';
import { LocationFormDialog } from '@/features/ubicaciones/components/location-form-dialog';
import { CajonFormDialog } from '@/features/ubicaciones/components/cajon-form-dialog';
import { CajonLlenoButton } from '@/features/mapa-salas/components/cajon-lleno-button';
import { cajonFullCode } from '@/features/ubicaciones/lib/location-code';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessRoute, canDo } from '@/features/auth/types/roles';
import { SalaMapaPanel } from '@/features/mapa-salas/components/sala-mapa-panel';

export default function UbicacionesPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canMarkFull = canDo(role, 'markCajonFull');
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationEntity | null>(null);

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

  const locations = locationsData?.data ?? [];

  // Active location for cajones view
  const activeLocation = useMemo(() => {
    if (selectedLocation) {
      return locations.find((l) => l.id === selectedLocation.id) ?? selectedLocation;
    }
    return locations[0] ?? null;
  }, [selectedLocation, locations]);

  const { data: cajonesData, isLoading: isLoadingCajones } = useCajones(
    activeLocation ? { location_id: activeLocation.id } : undefined,
  );

  const cajones: CajonEntity[] = cajonesData?.data ?? [];

  // Mutations
  const deleteLocationMutation = useDeleteLocation();
  const deleteCajonMutation = useDeleteCajon();
  const labelMutation = useDownloadCajonLabel();

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
    setCajonModalOpen(true);
  };

  /** Código completo del cajón; si la API aún no lo trae, se arma con el de la sala. */
  const cajonCode = (cajon: CajonEntity) =>
    cajon.barcode || cajonFullCode(cajon.location?.code ?? activeLocation?.code ?? '', cajon.codigo);

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

  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Salas y recintos */}
        <section
          aria-label="Salas y recintos"
          className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <SectionTitle as="h2" icon={Building2}>
              Salas y recintos
            </SectionTitle>
            <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400">{locations.length}</span>
          </div>
          <div className="border-b border-zinc-200 dark:border-zinc-800">
            <TableToolbar>
              <TableSearch
                value={search}
                onChange={setSearch}
                placeholder="Buscar por nombre o descripción…"
              />
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                aria-label="Filtrar por tipo"
                className={FILTER_CONTROL_CLASS}
              >
                <option value="">Todos los tipos</option>
                <option value="sala">Salas</option>
                <option value="panol">Pañoles</option>
                <option value="taller">Talleres</option>
                <option value="bodega">Bodegas</option>
              </select>
            </TableToolbar>
          </div>

          {isLoading ? (
            <SkeletonList label="Cargando ubicaciones…" rows={5} columns={2} />
          ) : locations.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No se encontraron salas o ubicaciones registradas."
              action={
                <Button type="button" variant="secondary" size="sm" onClick={handleOpenCreateLocation}>
                  <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                  Nueva sala / pañol
                </Button>
              }
            />
          ) : (
            <ul className="max-h-[600px] overflow-y-auto">
              {locations.map((loc) => {
                const isSelected = activeLocation?.id === loc.id;
                return (
                  <li
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSelectedLocation(loc);
                      }
                    }}
                    tabIndex={0}
                    aria-current={isSelected ? 'true' : undefined}
                    className={cn(
                      'relative flex cursor-pointer items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2.5 transition-colors duration-150 last:border-b-0 dark:border-zinc-800',
                      isSelected
                        ? 'bg-accent-soft before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <Building2
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400',
                        )}
                      />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {loc.code && <span className={`${CODE_CHIP_CLASS} shrink-0`}>{loc.code}</span>}
                          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {loc.nombre}
                          </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                          <Badge>{loc.tipo}</Badge>
                          {loc.descripcion && <span className="truncate">{loc.descripcion}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditLocation(loc);
                        }}
                        className={ICON_BUTTON_CLASS}
                        title="Editar ubicación"
                        aria-label={`Editar ${loc.nombre}`}
                      >
                        <Edit2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLocation(loc);
                        }}
                        className={ICON_BUTTON_CLASS}
                        title="Eliminar ubicación"
                        aria-label={`Eliminar ${loc.nombre}`}
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
        {/* Mapa de la sala activa (REQ-22): se mira aquí; la edición abre un modal. */}
        {activeLocation && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <SalaMapaPanel
              locationId={activeLocation.id}
              variant="embedded"
              canEdit={canDo(role, 'editRoomMap')}
              canSeeInventory={role ? canAccessRoute(role, '/inventario') : false}
            />
          </div>
        )}

        {/* Cajones de la sala activa */}
        <section
          aria-label="Cajones de la ubicación"
          className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          {activeLocation ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <SectionTitle as="h2" icon={FolderTree} className="min-w-0">
                  <span className="truncate">Cajones y gavetas en «{activeLocation.nombre}»</span>
                  <span className="font-mono font-normal text-zinc-500 dark:text-zinc-400">({cajones.length})</span>
                </SectionTitle>
                <Button type="button" variant="secondary" size="sm" onClick={handleOpenCreateCajon}>
                  <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                  Nuevo cajón
                </Button>
              </div>

              {isLoadingCajones ? (
                <SkeletonList label="Cargando compartimientos…" rows={4} columns={3} />
              ) : cajones.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title="Esta ubicación no tiene cajones ni gavetas."
                  description="Pulsa «Nuevo cajón» para agregar el primero."
                />
              ) : (
                <div className="max-h-[600px] overflow-y-auto p-4">
                  <CellGrid columns={2} aria-label="Cajones">
                    {cajones.map((cajon) => (
                      <Cell key={cajon.id}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-2">
                            <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            <div className="flex min-w-0 flex-col items-start gap-1">
                              <span className="max-w-full truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {cajon.codigo}
                              </span>
                              <span className="flex max-w-full flex-wrap items-center gap-1.5">
                                <span className={`${CODE_CHIP_CLASS} max-w-full truncate`}>{cajonCode(cajon)}</span>
                                {cajon.lleno && <Badge tone="loaned">Lleno</Badge>}
                              </span>
                              {cajon.descripcion && (
                                <span className="max-w-full truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                                  {cajon.descripcion}
                                </span>
                              )}
                              <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                                {cajon.estante ? (
                                  <>
                                    Estante <span className="font-code text-zinc-700 dark:text-zinc-200">{cajon.estante.codigo}</span>
                                  </>
                                ) : (
                                  'Sin estante'
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            {canMarkFull && (
                              <CajonLlenoButton cajonId={cajon.id} codigo={cajonCode(cajon)} lleno={Boolean(cajon.lleno)} compact />
                            )}
                            <button
                              type="button"
                              onClick={() => void handlePrintLabel(cajon)}
                              disabled={labelMutation.isPending && labelMutation.variables === cajon.id}
                              className={cn(ICON_BUTTON_CLASS, 'disabled:cursor-not-allowed disabled:opacity-50')}
                              title="Imprimir etiqueta"
                              aria-label={`Imprimir etiqueta de ${cajonCode(cajon)}`}
                            >
                              {labelMutation.isPending && labelMutation.variables === cajon.id ? (
                                <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Printer aria-hidden="true" className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCajon(cajon)}
                              className={ICON_BUTTON_CLASS}
                              title="Eliminar cajón"
                              aria-label={`Eliminar cajón ${cajon.codigo}`}
                            >
                              <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
                            </button>
                          </div>
                        </div>
                      </Cell>
                    ))}
                  </CellGrid>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={FolderTree}
              title="Selecciona o crea una sala para gestionar sus cajones."
            />
          )}
        </section>
        </div>
      </div>

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
