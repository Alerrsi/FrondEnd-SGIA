import { useEffect, useState } from 'react';
import { useCajones, useCreateProductUnits } from '@sgia/api-client';
import type { Producto } from '@sgia/types';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';

const controlClasses =
  FORM_CONTROL_CLASS;

export function AgregarUnidadesDialog({
  open,
  onClose,
  producto,
}: {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
}) {
  const createUnits = useCreateProductUnits();
  const { data: cajonesData, isLoading: loadingCajones } = useCajones(
    open ? { per_page: 100 } : undefined,
  );
  const cajones = cajonesData?.data ?? [];

  const [cajonId, setCajonId] = useState<number | null>(null);
  const [count, setCount] = useState(1);
  const [serials, setSerials] = useState('');

  useEffect(() => {
    if (open) {
      setCajonId(producto?.cajon_id ?? null);
      setCount(1);
      setSerials('');
    }
  }, [open, producto]);

  if (!producto) return null;

  const serialList = serials
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const effectiveCount = serialList.length > 0 ? serialList.length : count;
  const invalid = !cajonId || effectiveCount < 1 || effectiveCount > 200;

  const handleSubmit = async () => {
    if (!cajonId) return;
    try {
      await createUnits.mutateAsync({
        productId: producto.id,
        payload: {
          cajon_id: cajonId,
          count: effectiveCount,
          ...(serialList.length > 0 ? { serial_numbers: serialList } : {}),
        },
      });
      toast.success(`${effectiveCount} unidad(es) agregada(s)`);
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Agregar unidades"
      description={producto.nombre}
      className="max-w-md"
    >
      <div className="flex flex-col gap-3 text-xs">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-zinc-500">Cajón</span>
          <select
            className={controlClasses}
            value={cajonId ?? ''}
            disabled={loadingCajones}
            onChange={(e) => setCajonId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Seleccionar cajón…</option>
            {cajones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.location?.nombre ? `${c.location.nombre} · ` : ''}
                {c.codigo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-zinc-500">Cantidad (máx. 200)</span>
          <input
            type="number"
            min={1}
            max={200}
            className={controlClasses}
            value={serialList.length > 0 ? serialList.length : count}
            disabled={serialList.length > 0}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-zinc-500">Números de serie (opcional, uno por línea)</span>
          <textarea
            rows={4}
            className={`${controlClasses} h-auto py-1.5`}
            value={serials}
            onChange={(e) => setSerials(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={invalid || createUnits.isPending}
            onClick={handleSubmit}
          >
            {createUnits.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Agregar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
