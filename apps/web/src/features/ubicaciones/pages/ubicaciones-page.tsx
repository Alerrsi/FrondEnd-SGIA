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
  RefreshCw,
} from 'lucide-react';
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useCajones,
  useCreateCajon,
  useDeleteCajon,
} from '@sgia/api-client';
import type { LocationEntity, CajonEntity } from '@sgia/types';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';

export default function UbicacionesPage() {
  const [pendingDelete, setPendingDelete] = useState<
    { kind: 'location'; item: LocationEntity } | { kind: 'cajon'; item: CajonEntity } | null
  >(null);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationEntity | null>(null);

  // Modales
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationEntity | null>(null);
  const [locNombre, setLocNombre] = useState('');
  const [locTipo, setLocTipo] = useState('sala');
  const [locDescripcion, setLocDescripcion] = useState('');

  const [cajonModalOpen, setCajonModalOpen] = useState(false);
  const [cajonCodigo, setCajonCodigo] = useState('');
  const [cajonDescripcion, setCajonDescripcion] = useState('');

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
  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();
  const createCajonMutation = useCreateCajon();
  const deleteCajonMutation = useDeleteCajon();

  const handleOpenCreateLocation = () => {
    setEditingLocation(null);
    setLocNombre('');
    setLocTipo('sala');
    setLocDescripcion('');
    setLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: LocationEntity) => {
    setEditingLocation(loc);
    setLocNombre(loc.nombre);
    setLocTipo(loc.tipo);
    setLocDescripcion(loc.descripcion || '');
    setLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locNombre.trim()) {
      toast.error('El nombre de la ubicación es obligatorio');
      return;
    }

    try {
      if (editingLocation) {
        await updateLocationMutation.mutateAsync({
          id: editingLocation.id,
          payload: {
            nombre: locNombre.trim(),
            tipo: locTipo,
            descripcion: locDescripcion.trim() || undefined,
          },
        });
        toast.success('Ubicación actualizada correctamente');
      } else {
        await createLocationMutation.mutateAsync({
          nombre: locNombre.trim(),
          tipo: locTipo,
          descripcion: locDescripcion.trim() || undefined,
        });
        toast.success('Ubicación creada correctamente');
      }
      setLocationModalOpen(false);
    } catch {
      toast.error('Error al guardar la ubicación');
    }
  };

  const handleDeleteLocation = async (loc: LocationEntity) => {
    try {
      await deleteLocationMutation.mutateAsync(loc.id);
      if (selectedLocation?.id === loc.id) {
        setSelectedLocation(null);
      }
      toast.success('Ubicación eliminada');
    } catch {
      toast.error('Error al eliminar la ubicación');
    }
  };

  const handleOpenCreateCajon = () => {
    if (!activeLocation) return;
    setCajonCodigo('');
    setCajonDescripcion('');
    setCajonModalOpen(true);
  };

  const handleSaveCajon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLocation) return;
    if (!cajonCodigo.trim()) {
      toast.error('El código del cajón es obligatorio');
      return;
    }

    try {
      await createCajonMutation.mutateAsync({
        location_id: activeLocation.id,
        codigo: cajonCodigo.trim(),
        descripcion: cajonDescripcion.trim() || undefined,
      });
      toast.success('Cajón / gaveta agregada');
      setCajonModalOpen(false);
    } catch {
      toast.error('Error al agregar el cajón');
    }
  };

  const handleDeleteCajon = async (cajon: CajonEntity) => {
    try {
      await deleteCajonMutation.mutateAsync(cajon.id);
      toast.success('Cajón eliminado');
    } catch {
      toast.error('Error al eliminar el cajón');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-danger uppercase tracking-wider">
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-text-muted text-xs font-mono">/</span>
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
            Estructura Física
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <Layers aria-hidden="true" className="h-5 w-5 text-text" />
              Gestión de Ubicaciones Físicas y Cajones
            </h1>
            <p className="text-xs text-text-muted">
              Estructura jerárquica de Salas, Talleres, Estanterías y Cajones del pañol (REQ-05).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs gap-1.5"
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Actualizar</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreateLocation}
              className="text-xs gap-1.5 bg-ink text-background hover:opacity-90"
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Nueva Sala / Pañol</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-2.5 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="search"
              placeholder="Buscar por nombre o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border pl-8 pr-2 text-xs font-mono h-8 bg-background text-text placeholder:text-text-muted focus:outline-none focus:border-text-muted"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs font-mono text-text focus:outline-none"
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
        <div className="md:col-span-5 flex flex-col gap-2 rounded-md border border-border bg-surface p-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
              Salas y Recintos ({locations.length})
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-xs font-mono text-text-muted gap-2">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span>Cargando ubicaciones…</span>
            </div>
          ) : locations.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-text-muted">
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
                        ? 'border-border bg-surface-raised'
                        : 'border-border hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Building2 aria-hidden="true"
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          isSelected ? 'text-text' : 'text-text-muted'
                        }`}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-text truncate">
                          {loc.nombre}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
                          <span className="uppercase px-1 rounded bg-surface-raised font-semibold">
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
                        className="h-6 w-6 text-text-muted hover:text-text"
                        title="Editar ubicación"
                      >
                        <Edit2 aria-hidden="true" className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete({ kind: 'location', item: loc });
                        }}
                        className="h-6 w-6 text-text-muted hover:text-rose-600"
                        title="Eliminar ubicación"
                      >
                        <Trash2 aria-hidden="true" className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Cajones y Gavetas de la sala activa (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-3 rounded-md border border-border bg-surface p-3 shadow-xs">
          {activeLocation ? (
            <>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <FolderTree aria-hidden="true" className="h-4 w-4 text-text-muted" />
                  <span className="font-mono text-xs font-semibold text-text">
                    Cajones y Gavetas en "{activeLocation.nombre}" ({cajones.length})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenCreateCajon}
                  className="text-xs gap-1.5 h-7"
                >
                  <Plus aria-hidden="true" className="h-3 w-3" />
                  <span>Nuevo Cajón</span>
                </Button>
              </div>

              {isLoadingCajones ? (
                <div className="flex items-center justify-center p-8 text-xs font-mono text-text-muted gap-2">
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  <span>Cargando compartimientos…</span>
                </div>
              ) : cajones.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-text-muted border border-dashed border-border rounded">
                  Esta ubicación no tiene cajones o gavetas configuradas. Pulsa en "Nuevo Cajón" para añadir una.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
                  {cajones.map((cajon) => (
                    <div
                      key={cajon.id}
                      className="flex items-start justify-between gap-2 p-2.5 rounded border border-border bg-background font-mono text-xs"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-text truncate">
                            {cajon.codigo}
                          </span>
                          {cajon.descripcion && (
                            <span className="text-xs text-text-muted truncate">
                              {cajon.descripcion}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete({ kind: 'cajon', item: cajon })}
                        className="h-6 w-6 text-text-muted hover:text-rose-600 shrink-0"
                        title="Eliminar cajón"
                      >
                        <Trash2 aria-hidden="true" className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-text-muted">
              Selecciona o crea una sala en la columna izquierda para gestionar sus cajones.
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar Ubicación */}
      <Dialog
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title={editingLocation ? 'Editar Ubicación' : 'Nueva Sala / Ubicación'}
        description="Define los datos del recinto o sala de pañol."
      >
        <form onSubmit={handleSaveLocation} className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-text">
              Nombre de la Sala / Recinto *
            </label>
            <input
              value={locNombre}
              onChange={(e) => setLocNombre(e.target.value)}
              placeholder="Ej. Pañol Central, Lab 201, Taller Mecánica…"
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs font-mono text-text placeholder:text-text-muted focus:outline-none focus:border-text-muted"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-text">
              Tipo de Espacio
            </label>
            <select
              value={locTipo}
              onChange={(e) => setLocTipo(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2 text-xs font-mono text-text focus:outline-none"
            >
              <option value="sala">Sala de Clases</option>
              <option value="panol">Pañol TI</option>
              <option value="taller">Taller Práctico</option>
              <option value="bodega">Bodega de Almacenamiento</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-text">
              Descripción / Referencia
            </label>
            <input
              value={locDescripcion}
              onChange={(e) => setLocDescripcion(e.target.value)}
              placeholder="Ej. Edificio B, Segundo Piso, Sector Redes"
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs font-mono text-text placeholder:text-text-muted focus:outline-none focus:border-text-muted"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <DialogCloseButton variant="outline" size="sm">
              Cancelar
            </DialogCloseButton>
            <Button type="submit" variant="primary" size="sm">
              Guardar Ubicación
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Crear Cajón */}
      <Dialog
        open={cajonModalOpen}
        onClose={() => setCajonModalOpen(false)}
        title="Nuevo Cajón / Gaveta"
        description={`Añade un compartimiento a ${activeLocation?.nombre}.`}
      >
        <form onSubmit={handleSaveCajon} className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-text">
              Código / Identificador del Cajón *
            </label>
            <input
              value={cajonCodigo}
              onChange={(e) => setCajonCodigo(e.target.value)}
              placeholder="Ej. Estante 1, Gaveta B-4, Rack Principal…"
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs font-mono text-text placeholder:text-text-muted focus:outline-none focus:border-text-muted"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-text">
              Descripción (Opcional)
            </label>
            <input
              value={cajonDescripcion}
              onChange={(e) => setCajonDescripcion(e.target.value)}
              placeholder="Ej. Cables HDMI y adaptadores VGA"
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs font-mono text-text placeholder:text-text-muted focus:outline-none focus:border-text-muted"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <DialogCloseButton variant="outline" size="sm">
              Cancelar
            </DialogCloseButton>
            <Button type="submit" variant="primary" size="sm">
              Guardar Cajón
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        variant="danger"
        title={pendingDelete?.kind === 'location' ? 'Eliminar ubicación' : 'Eliminar compartimiento'}
        description={
          pendingDelete?.kind === 'location'
            ? `¿Eliminar la ubicación “${pendingDelete.item.nombre}” y sus cajones asociados?`
            : `¿Eliminar el compartimiento “${pendingDelete?.item.codigo}”?`
        }
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (target?.kind === 'location') await handleDeleteLocation(target.item);
          else if (target) await handleDeleteCajon(target.item);
        }}
      />
    </div>
  );
}
