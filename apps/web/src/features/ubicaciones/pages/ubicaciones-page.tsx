import { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
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
import { PageHeading } from '@/components/ui/page-heading';
import { CODE_CHIP_CLASS, STATE_TEXT_CLASS } from '@/components/ui/typography';
import { printBlob } from '@/features/equipos/utils/download';
import { LocationFormDialog } from '@/features/ubicaciones/components/location-form-dialog';
import { CajonFormDialog } from '@/features/ubicaciones/components/cajon-form-dialog';
import { cajonFullCode } from '@/features/ubicaciones/lib/location-code';

export default function UbicacionesPage() {
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
    <div className="flex flex-col gap-4">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-2">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeading icon={Layers} title="Gestión de ubicaciones físicas y cajones">
            Estructura jerárquica de Salas, Talleres, Estanterías y Cajones del pañol.
          </PageHeading>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Actualizar</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreateLocation} className="gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nueva sala / pañol</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 shadow-xs">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="search"
              placeholder="Buscar por nombre o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 pl-8 pr-2 text-xs font-mono h-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="sala">Salas</option>
            <option value="panol">Pañoles</option>
            <option value="taller">Talleres</option>
            <option value="bodega">Bodegas</option>
          </select>
        </div>
      </div>

      {/* Grid Split: Lista de Ubicaciones a la izquierda, Cajones/Detalle a la derecha */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Columna Izquierda: Salas y Ubicaciones (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="text-xs font-semibold text-zinc-500">
              Salas y Recintos ({locations.length})
            </span>
          </div>

          {isLoading ? (
            <div className={`flex items-center justify-center p-8 gap-2 ${STATE_TEXT_CLASS}`}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando ubicaciones…</span>
            </div>
          ) : locations.length === 0 ? (
            <div className={`p-6 ${STATE_TEXT_CLASS}`}>
              No se encontraron salas o ubicaciones registradas.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto pr-1">
              {locations.map((loc) => {
                const isSelected = activeLocation?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                        : 'border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Building2
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
                        }`}
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {loc.code && <span className={`${CODE_CHIP_CLASS} shrink-0`}>{loc.code}</span>}
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {loc.nombre}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          <span className="px-1 rounded bg-zinc-200/60 dark:bg-zinc-700/60 font-semibold">
                            {loc.tipo}
                          </span>
                          {loc.descripcion && <span className="truncate max-w-[150px]">{loc.descripcion}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditLocation(loc);
                        }}
                        className="h-6 w-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Editar ubicación"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLocation(loc);
                        }}
                        className="h-6 w-6 text-zinc-400 hover:text-rose-600"
                        title="Eliminar ubicación"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Cajones y Gavetas de la sala activa (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs">
          {activeLocation ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                  <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Cajones y Gavetas en "{activeLocation.nombre}" ({cajones.length})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenCreateCajon} className="gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  <span>Nuevo cajón</span>
                </Button>
              </div>

              {isLoadingCajones ? (
                <div className={`flex items-center justify-center p-8 gap-2 ${STATE_TEXT_CLASS}`}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando compartimientos…</span>
                </div>
              ) : cajones.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
                  Esta ubicación no tiene cajones o gavetas configuradas. Pulsa en "Nuevo cajón" para añadir una.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
                  {cajones.map((cajon) => (
                    <div
                      key={cajon.id}
                      className="flex items-start justify-between gap-2 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 font-mono text-xs"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500 mt-0.5 shrink-0" />
                        <div className="flex flex-col items-start gap-1 min-w-0">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-full">
                            {cajon.codigo}
                          </span>
                          <span className={`${CODE_CHIP_CLASS} max-w-full truncate`}>{cajonCode(cajon)}</span>
                          {cajon.descripcion && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-full">
                              {cajon.descripcion}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => void handlePrintLabel(cajon)}
                          disabled={labelMutation.isPending && labelMutation.variables === cajon.id}
                          className="h-6 w-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          title="Imprimir etiqueta"
                          aria-label={`Imprimir etiqueta de ${cajonCode(cajon)}`}
                        >
                          {labelMutation.isPending && labelMutation.variables === cajon.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Printer className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCajon(cajon)}
                          className="h-6 w-6 text-zinc-400 hover:text-rose-600"
                          title="Eliminar cajón"
                          aria-label={`Eliminar cajón ${cajon.codigo}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={`p-12 ${STATE_TEXT_CLASS}`}>
              Selecciona o crea una sala en la columna izquierda para gestionar sus cajones.
            </div>
          )}
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
