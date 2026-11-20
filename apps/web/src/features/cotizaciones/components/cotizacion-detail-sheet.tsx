import type { Cotizacion } from '@sgia/types';
import { Building2, Calendar, FileText, Package } from 'lucide-react';

import { QuotationStatusBadge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SectionLabel } from '@/components/ui/section-label';

interface CotizacionDetailSheetProps {
  open: boolean;
  onClose: () => void;
  cotizacion: Cotizacion | null;
}

export function CotizacionDetailSheet({
  open,
  onClose,
  cotizacion,
}: CotizacionDetailSheetProps) {
  if (!cotizacion) return null;

  const items = cotizacion.items ?? cotizacion.products ?? [];
  const suppliers = cotizacion.suppliers ?? [];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            <FileText aria-hidden="true" className="h-4 w-4 text-zinc-500" />
            <span>Cotización {cotizacion.code ?? `#${cotizacion.id}`}</span>
          </SheetTitle>
          <SheetDescription>
            Historial del flujo anterior: solo lectura.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-4">
          {/* Status & date */}
          <div className="flex items-center justify-between">
            <QuotationStatusBadge estado={cotizacion.estado} />
            <span className="inline-flex items-center gap-1 font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
              <Calendar aria-hidden="true" className="h-3 w-3" />
              {cotizacion.createdAt
                ? new Date(cotizacion.createdAt).toLocaleDateString('es-CL')
                : '—'}
            </span>
          </div>

          {/* Products */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
            <SectionLabel icon={Package}>Productos solicitados ({items.length})</SectionLabel>
            {items.length === 0 ? (
              <p className="py-2 text-[13px] text-zinc-500 dark:text-zinc-400">Sin productos registrados.</p>
            ) : (
              <div className="space-y-1">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-[13px]"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {item.name ?? `Producto #${item.productoId ?? item.product_id}`}
                    </span>
                    <span className="font-mono text-zinc-500 dark:text-zinc-400">
                      ×{item.cantidad ?? item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suppliers */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
            <SectionLabel icon={Building2}>Proveedores contactados ({suppliers.length})</SectionLabel>
            {suppliers.length === 0 ? (
              <p className="py-2 text-[13px] text-zinc-500 dark:text-zinc-400">
                {cotizacion.proveedor ?? 'Sin proveedores registrados.'}
              </p>
            ) : (
              <div className="space-y-1">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-[13px]"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {supplier.name}
                    </span>
                    <span className="truncate text-zinc-500 dark:text-zinc-400">{supplier.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {(cotizacion.notas ?? cotizacion.notes) && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <SectionLabel className="mb-1">Notas</SectionLabel>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {cotizacion.notas ?? cotizacion.notes}
              </p>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
