import { useState } from 'react';
import { formatDate } from '@/lib/format';
import type { Cotizacion, Supplier } from '@sgia/types';
import { useUpdateQuotationStatus } from '@sgia/api-client';
import { QuotationStatus } from '@sgia/types';
import { Building2, Calendar, FileText, Package, ShoppingCart } from 'lucide-react';

import { canDo } from '@/features/auth/types/roles';
import { useAuth } from '@/features/auth/context/auth-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

import { QuotationResponseDialog } from '@/features/cotizaciones/components/quotation-response-dialog';
import { QuotationStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface CotizacionDetailSheetProps {
  open: boolean;
  onClose: () => void;
  cotizacion: Cotizacion | null;
  onGenerateOrder?: (cotizacion: Cotizacion) => void;
}

export function CotizacionDetailSheet({
  open,
  onClose,
  cotizacion,
  onGenerateOrder,
}: CotizacionDetailSheetProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateQuotationStatus();
  const [responding, setResponding] = useState<Supplier | null>(null);
  if (!cotizacion) return null;

  const items = cotizacion.items ?? cotizacion.products ?? [];
  const suppliers = cotizacion.suppliers ?? [];
  const canGenerateOrder = cotizacion.estado === QuotationStatus.ACEPTADA;

  // Solo el director cambia el estado; el backend valida la transición.
  const canChangeStatus =
    canDo(user?.rol, 'changeQuotationStatus') && cotizacion.estado === QuotationStatus.PENDIENTE;
  const canRespond =
    canDo(user?.rol, 'respondQuotation') && cotizacion.estado === QuotationStatus.PENDIENTE;
  const changeStatus = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ id: cotizacion.id, status });
      toast.success('Estado de la cotización actualizado.');
      onClose();
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-text">
            <FileText className="h-4 w-4 text-text-muted" />
            <span className="font-mono">Cotización #{cotizacion.id}</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-text-muted">
            Detalle de la cotización emitida y proveedores contactados.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-4">
          {/* Status & date */}
          <div className="flex items-center justify-between">
            <QuotationStatusBadge estado={cotizacion.estado} />
            <span className="inline-flex items-center gap-1 text-xs text-text-muted font-mono">
              <Calendar className="h-3 w-3" />
              {formatDate(cotizacion.createdAt)}
            </span>
          </div>

          {/* Products */}
          <div className="rounded-md border border-border p-3 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Productos solicitados ({items.length})
            </h3>
            {items.length === 0 ? (
              <p className="text-xs text-text-muted py-2">Sin productos registrados.</p>
            ) : (
              <div className="space-y-1">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 text-xs"
                  >
                    <span className="text-text font-medium">
                      {item.name ?? `Producto #${item.productoId ?? item.product_id}`}
                    </span>
                    <span className="font-mono text-text-muted">
                      ×{item.cantidad ?? item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suppliers */}
          <div className="rounded-md border border-border p-3 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Proveedores contactados ({suppliers.length})
            </h3>
            {suppliers.length === 0 ? (
              <p className="text-xs text-text-muted py-2">
                {cotizacion.proveedor ?? 'Sin proveedores registrados.'}
              </p>
            ) : (
              <div className="space-y-1">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between rounded border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 text-xs"
                  >
                    <span className="text-text font-medium">
                      {supplier.name}
                    </span>
                    <span className="font-mono text-text-muted text-xs">{supplier.email}</span>
                    {canRespond && (
                      <Button size="sm" onClick={() => setResponding(supplier)}>
                        Registrar respuesta
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {(cotizacion.notas ?? cotizacion.notes) && (
            <div className="rounded-md border border-border p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Notas
              </h3>
              <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">
                {cotizacion.notas ?? cotizacion.notes}
              </p>
            </div>
          )}

          {canChangeStatus && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                disabled={updateStatus.isPending}
                onClick={() => changeStatus(QuotationStatus.ACEPTADA)}
                className="flex-1 text-xs"
              >
                Aceptar
              </Button>
              <Button
                disabled={updateStatus.isPending}
                onClick={() => changeStatus(QuotationStatus.RECHAZADA)}
                className="flex-1 text-xs"
              >
                Rechazar
              </Button>
            </div>
          )}

          {/* Action: Generate Purchase Order */}
          {canGenerateOrder && onGenerateOrder && (
            <Button
              variant="primary"
              onClick={() => onGenerateOrder(cotizacion)}
              className="w-full text-xs"
            >
              <ShoppingCart className="h-4 w-4" />
              Aprobar y Generar Orden de Compra
            </Button>
          )}
        </div>
      </SheetContent>
      {responding && (
        <QuotationResponseDialog
          open
          onClose={() => {
            setResponding(null);
            onClose();
          }}
          cotizacion={cotizacion}
          supplier={responding}
        />
      )}
    </Sheet>
  );
}
