import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePurchaseRequestAreas, useSendPurchaseRequest, useSuppliers } from '@sgia/api-client';
import { SUPPLIER_AREAS, type PurchaseRequest, type SupplierArea } from '@sgia/types';
import { Loader2, Send } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { SupplierAreasField } from '@/features/proveedores/components/supplier-areas-field';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const sendSchema = z.object({
  areas: z.array(z.enum(SUPPLIER_AREAS)).min(1, 'Elige al menos un área.'),
});

type SendValues = z.infer<typeof sendSchema>;

interface SendPurchaseRequestDialogProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
}

/** Elige áreas y envía la solicitud a todos los proveedores activos de esas áreas (1 correo por proveedor). */
export function SendPurchaseRequestDialog({ open, onClose, request }: SendPurchaseRequestDialogProps) {
  const send = useSendPurchaseRequest();
  const { data: areaOptions } = usePurchaseRequestAreas();
  const { data: suppliersData } = useSuppliers({ is_active: true, per_page: 200 });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<SendValues>({ resolver: zodResolver(sendSchema), defaultValues: { areas: [] } });
  const areas = useWatch({ control, name: 'areas' });

  useEffect(() => {
    if (open) reset({ areas: [] });
  }, [open, reset]);

  const activeSuppliers = useMemo(
    () => (suppliersData?.data ?? []).filter((s) => s.is_active !== false),
    [suppliersData],
  );
  const countByArea = (area: SupplierArea) =>
    activeSuppliers.filter((s) => s.areas.includes(area)).length;
  // Vista previa: un proveedor en 2 áreas cuenta una sola vez (el backend deduplica igual).
  const recipients = activeSuppliers.filter((s) => s.areas.some((a) => areas.includes(a)));

  const onSubmit = handleSubmit(async (values) => {
    try {
      const sent = await send.mutateAsync({ id: request.id, payload: values });
      const failed = sent.suppliers.filter((s) => s.email_error).length;
      if (failed > 0) {
        toast.warning(
          `Solicitud enviada a ${sent.suppliers.length} proveedor(es); ${failed} correo(s) fallaron. Puedes reintentarlos.`,
        );
      } else {
        toast.success(`Solicitud enviada a ${sent.suppliers.length} proveedor(es).`);
      }
      onClose();
    } catch (error) {
      const fieldErrors = apiFieldErrors(error);
      const areaError = Object.entries(fieldErrors).find(([f]) => f.startsWith('areas'));
      if (areaError) setError('areas', { message: areaError[1] });
      toast.error(apiErrorToMessage(error));
    }
  });

  const pending = send.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title={`Enviar ${request.code} a proveedores`}
      description="Se contacta por correo a todos los proveedores activos de las áreas elegidas. Un proveedor que está en varias áreas recibe un solo correo."
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Controller
          control={control}
          name="areas"
          render={({ field }) => (
            <SupplierAreasField
              label="Áreas de proveedor"
              options={areaOptions ?? SUPPLIER_AREAS}
              value={field.value}
              onChange={field.onChange}
              disabled={pending}
              invalid={Boolean(errors.areas)}
              hint={(area) => `${countByArea(area)} activos`}
            />
          )}
        />
        {errors.areas && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400">{errors.areas.message}</p>
        )}

        <div className="rounded-md border border-zinc-200 bg-zinc-50/60 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            Destinatarios estimados: {recipients.length}
          </p>
          {areas.length > 0 && recipients.length === 0 && (
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              No hay proveedores activos en esas áreas: el envío será rechazado.
            </p>
          )}
          {recipients.length > 0 && (
            <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto">
              {recipients.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span className="truncate text-zinc-700 dark:text-zinc-300">{s.name}</span>
                  <span className="font-mono text-zinc-500">{s.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <DialogCloseButton disabled={pending}>Cancelar</DialogCloseButton>
          <Button type="submit" disabled={pending || areas.length === 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar correos
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
