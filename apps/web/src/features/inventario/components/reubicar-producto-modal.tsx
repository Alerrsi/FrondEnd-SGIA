import { useEffect, useState } from 'react';
import {
  useCajones,
  useLocations,
  useUpdateProductLocation,
} from '@sgia/api-client';
import type { LocationEntity, Producto } from '@sgia/types';
import { Loader2, MapPin, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const controlClasses =
  'w-full h-8 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50';

export function ReubicarProductoModal({
  open,
  onClose,
  producto,
}: {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
}) {
  const updateProductLocation = useUpdateProductLocation();
  const { data: locationsData, isLoading: isLoadingLocations } = useLocations({
    per_page: 50,
  });

  const locations = locationsData?.data ?? [];

  // Selected state
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedCajonId, setSelectedCajonId] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [customSala, setCustomSala] = useState('');
  const [customCajon, setCustomCajon] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Fetch cajones for the selected location
  const { data: cajonesData, isLoading: isLoadingCajones } = useCajones(
    selectedLocationId
      ? { location_id: selectedLocationId, per_page: 50 }
      : undefined,
  );

  const cajones = cajonesData?.data ?? [];

  useEffect(() => {
    if (open && producto) {
      const currentLocId =
        producto.location_id ??
        (producto.location && 'id' in producto.location
          ? (producto.location as LocationEntity).id
          : null);
      const currentCajonId = producto.cajon_id ?? producto.cajon?.id ?? null;

      setSelectedLocationId(currentLocId ?? null);
      setSelectedCajonId(currentCajonId ?? null);
      setCustomSala(producto.ubicacion?.sala || '');
      setCustomCajon(producto.ubicacion?.cajon || '');
      setDescripcion(producto.ubicacion?.descripcion || '');
      setManualMode(false);
    }
  }, [open, producto]);

  if (!producto) return null;

  const isPending = updateProductLocation.isPending;
  const currentSala = producto.ubicacion?.sala;
  const currentCajon = producto.ubicacion?.cajon;
  const hasCurrentLocation = currentSala || currentCajon;

  const handleLocationChange = (locIdStr: string) => {
    if (locIdStr === 'manual') {
      setManualMode(true);
      setSelectedLocationId(null);
      setSelectedCajonId(null);
      return;
    }

    setManualMode(false);
    const locId = Number(locIdStr) || null;
    setSelectedLocationId(locId);
    setSelectedCajonId(null); // Reset cajón when location changes
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (manualMode) {
        if (!customSala.trim() || !customCajon.trim()) {
          toast.error('Debes indicar tanto la sala como el cajón en modo manual');
          return;
        }

        await updateProductLocation.mutateAsync({
          id: producto.id,
          payload: {
            sala: customSala.trim(),
            cajon: customCajon.trim(),
            descripcion: descripcion.trim() || undefined,
          },
        });
      } else {
        if (!selectedLocationId && !selectedCajonId) {
          toast.error('Selecciona una sala o cajón de la lista');
          return;
        }

        await updateProductLocation.mutateAsync({
          id: producto.id,
          payload: {
            location_id: selectedLocationId || undefined,
            cajon_id: selectedCajonId || undefined,
            descripcion: descripcion.trim() || undefined,
          },
        });
      }

      toast.success(
        `Ubicación de "${producto.nombre || producto.name}" actualizada con éxito`,
      );
      onClose();
    } catch (err) {
      toast.error(apiErrorToMessage(err));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reubicar producto en pañol"
      description={`Asigna o cambia la ubicación física de almacenamiento para ${producto.nombre || producto.name}.`}
      className="max-w-lg"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-100">
        {/* Ubicación actual */}
        <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-zinc-400" />
            <div>
              <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Ubicación actual registrada:
              </span>
              <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {hasCurrentLocation
                  ? `${currentSala || '—'} · ${currentCajon || '—'}`
                  : 'Sin ubicación física asignada'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
            <span>{manualMode ? 'Seleccionar de lista' : 'Entrada manual'}</span>
          </button>
        </div>

        {!manualMode ? (
          <div className="flex flex-col gap-3">
            {/* Selector de Sala / Ubicación física (API) */}
            <div>
              <label
                htmlFor="reubicar-sala-select"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                1. Sala o Almacén principal <span className="text-red-500">*</span>
              </label>
              <select
                id="reubicar-sala-select"
                disabled={isPending || isLoadingLocations}
                value={selectedLocationId ?? ''}
                onChange={(e) => handleLocationChange(e.target.value)}
                className={controlClasses}
              >
                <option value="">-- Seleccionar sala o dependencia --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nombre || loc.sala} ({loc.tipo || 'sala'})
                    {loc.cajones_count ? ` · ${loc.cajones_count} cajones` : ''}
                  </option>
                ))}
                <option value="manual">+ Otra sala / ingresar manualmente</option>
              </select>
            </div>

            {/* Selector de Cajón / Estante dependiente (API) */}
            <div>
              <label
                htmlFor="reubicar-cajon-select"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                2. Cajón, Estante o Gaveta
              </label>
              <select
                id="reubicar-cajon-select"
                disabled={
                  isPending ||
                  !selectedLocationId ||
                  isLoadingCajones ||
                  cajones.length === 0
                }
                value={selectedCajonId ?? ''}
                onChange={(e) => setSelectedCajonId(Number(e.target.value) || null)}
                className={controlClasses}
              >
                <option value="">
                  {!selectedLocationId
                    ? 'Primero selecciona una sala'
                    : isLoadingCajones
                      ? 'Cargando cajones...'
                      : cajones.length === 0
                        ? 'No hay cajones registrados en esta sala'
                        : '-- Seleccionar cajón o gaveta --'}
                </option>
                {cajones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} {c.descripcion ? `(${c.descripcion})` : ''}
                  </option>
                ))}
              </select>
              {selectedLocationId && cajones.length === 0 && !isLoadingCajones && (
                <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Puedes guardar solo la sala, o cambiar al modo manual para especificar un cajón nuevo.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reubicar-custom-sala"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                Nombre de la Sala <span className="text-red-500">*</span>
              </label>
              <input
                id="reubicar-custom-sala"
                type="text"
                disabled={isPending}
                value={customSala}
                onChange={(e) => setCustomSala(e.target.value)}
                placeholder="Ej. Pañol Central"
                className={controlClasses}
              />
            </div>

            <div>
              <label
                htmlFor="reubicar-custom-cajon"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                Código de Cajón / Estante <span className="text-red-500">*</span>
              </label>
              <input
                id="reubicar-custom-cajon"
                type="text"
                disabled={isPending}
                value={customCajon}
                onChange={(e) => setCustomCajon(e.target.value)}
                placeholder="Ej. Estante B-2"
                className={controlClasses}
              />
            </div>
          </div>
        )}

        {/* Descripción de referencia */}
        <div>
          <label
            htmlFor="reubicar-desc"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
          >
            Nota de referencia física (Opcional)
          </label>
          <input
            id="reubicar-desc"
            type="text"
            disabled={isPending}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Gaveta antiestática, repisa superior"
            className={controlClasses}
          />
        </div>

        {/* Botones de acción */}
        <div className="mt-2 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending} className="text-xs">
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending} className="min-w-32 text-xs">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmar reubicación
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
