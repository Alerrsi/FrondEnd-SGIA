import { useState } from 'react';
import { useCotizaciones } from '@sgia/api-client';
import type { Cotizacion } from '@sgia/types';
import { AlertCircle, ClipboardList, FileText, Plus } from 'lucide-react';

import { QuotationStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CotizacionFormDialog } from '@/features/cotizaciones/components/cotizacion-form-dialog';
import { CotizacionDetailSheet } from '@/features/cotizaciones/components/cotizacion-detail-sheet';

export default function CotizacionesPage() {
  const { data, isLoading, isError } = useCotizaciones({ page: 1, perPage: 20 });

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);

  const handleGenerateOrder = (_cotizacion: Cotizacion) => {
    // Navigate or trigger order creation flow (REQ-08)
    // For now, close the sheet — integration with REQ-08 pending
    setSelectedCotizacion(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 py-12 justify-center">
        <span>Cargando historial de cotizaciones…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-700 dark:text-red-400">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
        <span>No se pudo cargar el historial de cotizaciones desde el servidor.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span data-sede-badge="true" className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-red-600 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
            SEDE TEMUCO · ADQUISICIONES
          </span>
          <span className="text-zinc-400 text-xs font-mono">/</span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Cotizaciones
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Cotizaciones a Proveedores
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Gestión y seguimiento de cotizaciones y adquisiciones de insumos (REQ-07 / REQ-08).
            </p>
          </div>
          <Button variant="primary" onClick={() => setFormOpen(true)} className="text-xs">
            <Plus className="h-4 w-4" />
            Nueva cotización
          </Button>
        </div>
      </div>

      {/* Cotizaciones list */}
      <div className="flex flex-col gap-3">
        {data.data.length === 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No hay cotizaciones registradas actualmente. Emite una nueva cotización seleccionando
            productos y al menos 3 proveedores.
          </div>
        )}
        {data.data.map((cotizacion) => (
          <Card
            key={cotizacion.id}
            className="flex items-center justify-between gap-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            onClick={() => setSelectedCotizacion(cotizacion)}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-zinc-400" />
                <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  #{cotizacion.id}
                </span>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {cotizacion.proveedor ?? 'Múltiples proveedores'} · {cotizacion.items.length} ítems
              </span>
              {cotizacion.createdAt && (
                <span className="text-[10px] font-mono text-zinc-400">
                  {new Date(cotizacion.createdAt).toLocaleDateString('es-CL')}
                </span>
              )}
            </div>
            <QuotationStatusBadge estado={cotizacion.estado} />
          </Card>
        ))}
      </div>

      {/* New Cotización Dialog */}
      <CotizacionFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

      {/* Cotización Detail Sheet */}
      <CotizacionDetailSheet
        open={selectedCotizacion !== null}
        onClose={() => setSelectedCotizacion(null)}
        cotizacion={selectedCotizacion}
        onGenerateOrder={handleGenerateOrder}
      />
    </div>
  );
}
