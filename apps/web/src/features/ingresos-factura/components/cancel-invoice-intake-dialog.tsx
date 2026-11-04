import { useEffect, useState } from 'react';
import { useCancelInvoiceIntake } from '@sgia/api-client';
import { InvoiceIntakeStatus, type InvoiceIntake } from '@sgia/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { formatCLP } from '@/features/compras/lib/format';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

interface CancelInvoiceIntakeDialogProps {
  intake: InvoiceIntake | null;
  onClose: () => void;
  onCancelled?: (intake: InvoiceIntake) => void;
}

/**
 * Anular un borrador no tiene efecto; anular uno confirmado revierte todo (stock, unidades y monto)
 * o nada: si la reversa no es posible el backend responde 422 en `items` y se muestra aquí.
 */
export function CancelInvoiceIntakeDialog({
  intake,
  onClose,
  onCancelled,
}: CancelInvoiceIntakeDialogProps) {
  const cancelIntake = useCancelInvoiceIntake();
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    setBlockedReason(null);
  }, [intake?.id]);

  if (!intake) return null;
  const confirmed = intake.status === InvoiceIntakeStatus.CONFIRMADO;
  const label = intake.document_number ?? `#${intake.id}`;

  const handleCancel = async () => {
    try {
      const result = await cancelIntake.mutateAsync(intake.id);
      toast.success(
        confirmed
          ? `Factura ${label} anulada: se revirtió el stock y se repusieron ${formatCLP(intake.total_deducted)}.`
          : `Borrador ${label} anulado.`,
      );
      onCancelled?.(result);
      onClose();
    } catch (error) {
      const fields = apiFieldErrors(error);
      const reason = fields.items ?? fields.status ?? apiErrorToMessage(error);
      setBlockedReason(reason);
      toast.error(reason);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={confirmed ? `Anular factura ${label}` : `Anular borrador ${label}`}
      className="max-w-md"
    >
      <div className="flex flex-col gap-3 text-xs text-zinc-700 dark:text-zinc-300">
        {confirmed ? (
          <>
            <p>La anulación revierte la factura completa, todo o nada:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Resta del stock la cantidad ingresada de cada insumo.</li>
              <li>Da de baja las unidades de equipo o maqueta que creó.</li>
              <li>
                Repone <span className="font-mono">{formatCLP(intake.total_deducted)}</span> al
                presupuesto (movimiento de reposición).
              </li>
            </ul>
            <p className="text-zinc-500">La compra ligada no cambia de estado.</p>
          </>
        ) : (
          <p>El borrador quedará anulado. No se modifica stock ni presupuesto.</p>
        )}

        {blockedReason && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-2.5 text-rose-800 dark:text-rose-300"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {blockedReason}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <DialogCloseButton disabled={cancelIntake.isPending}>Volver</DialogCloseButton>
          <Button variant="danger" onClick={handleCancel} disabled={cancelIntake.isPending}>
            {cancelIntake.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmed ? 'Anular y revertir' : 'Anular borrador'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
