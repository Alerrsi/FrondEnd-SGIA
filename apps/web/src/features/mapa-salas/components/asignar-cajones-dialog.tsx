import { useEffect, useMemo, useState } from 'react';
import { Archive, Loader2 } from 'lucide-react';
import { useCajones, useUpdateCajon } from '@sgia/api-client';
import type { CajonEntity } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { CODE_CHIP_CLASS, SECTION_LABEL_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

export interface AsignarCajonesDialogProps {
  open: boolean;
  onClose: () => void;
  locationId: number;
  estante: { id: number; codigo: string } | null;
}

/**
 * Marca qué cajones van en el estante. Solo se ofrecen cajones de la sala del estante (los suyos y los sueltos);
 * la API además rechaza un estante de otra sala (`422` en `estante_id`).
 */
export function AsignarCajonesDialog({ open, onClose, locationId, estante }: AsignarCajonesDialogProps) {
  const enabled = open && estante !== null;
  const asignados = useCajones(enabled ? { location_id: locationId, estante_id: estante?.id, per_page: 100 } : undefined);
  const sueltos = useCajones(enabled ? { location_id: locationId, sin_estante: true, per_page: 100 } : undefined);
  const updateCajon = useUpdateCajon();
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  // Clave por ids: el arreglo puede cambiar de referencia sin cambiar de contenido (refetch); así no se pierden las marcas.
  const assignedKey = (asignados.data?.data ?? []).map((cajon) => cajon.id).join(',');
  const assignedIds = useMemo(() => (assignedKey ? assignedKey.split(',').map(Number) : []), [assignedKey]);
  const cajones: CajonEntity[] = useMemo(
    () => [...(asignados.data?.data ?? []), ...(sueltos.data?.data ?? [])].sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [asignados.data, sueltos.data],
  );

  useEffect(() => {
    if (open) setChecked(new Set(assignedIds));
  }, [open, assignedIds]);

  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const changes = cajones.filter((cajon) => checked.has(cajon.id) !== assignedIds.includes(cajon.id));

  const save = async () => {
    if (!estante) return;
    setSaving(true);
    try {
      for (const cajon of changes) {
        await updateCajon.mutateAsync({ id: cajon.id, payload: { estante_id: checked.has(cajon.id) ? estante.id : null } });
      }
      toast.success(`Cajones del estante ${estante.codigo} actualizados`);
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const loading = asignados.isLoading || sueltos.isLoading;

  return (
    <Dialog open={open} onClose={onClose} size="sm" hasUnsavedChanges={changes.length > 0} title={`Cajones del estante ${estante?.codigo ?? ''}`} description="Marca los cajones que están en este mueble. Su código y su etiqueta no cambian.">
      <div className="flex flex-col gap-3">
        {loading && (
          <p className="flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Cargando cajones…
          </p>
        )}
        {!loading && cajones.length === 0 && (
          <EmptyState icon={Archive} title="No hay cajones libres" description="Todos los cajones de la sala ya están en un estante. Crea cajones en Ubicaciones." />
        )}
        {!loading && cajones.length > 0 && (
          <>
            <p className={SECTION_LABEL_CLASS}>{checked.size} marcados</p>
            <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {cajones.map((cajon) => (
                <li key={cajon.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm pointer-coarse:py-3">
                    <input type="checkbox" className="h-4 w-4 accent-accent" checked={checked.has(cajon.id)} onChange={() => toggle(cajon.id)} />
                    <span className={CODE_CHIP_CLASS}>{cajon.barcode ?? cajon.codigo}</span>
                    {cajon.descripcion && <span className="min-w-0 truncate text-[13px] text-zinc-500 dark:text-zinc-400">{cajon.descripcion}</span>}
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}
        <DialogFooter>
          <DialogCloseButton disabled={saving}>Cancelar</DialogCloseButton>
          <Button size="sm" disabled={saving || changes.length === 0} onClick={() => void save()}>
            {saving && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
