import { useState } from 'react';
import { useCotizaciones } from '@sgia/api-client';
import type { Cotizacion } from '@sgia/types';
import { AlertCircle, Archive, FileText } from 'lucide-react';

import { QuotationStatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CotizacionDetailSheet } from '@/features/cotizaciones/components/cotizacion-detail-sheet';
import { LegacyQuotationsNotice } from '@/features/cotizaciones/components/legacy-quotations-notice';

/** Historial del flujo antiguo de cotizaciones: solo lectura (lista y detalle). */
export default function CotizacionesPage() {
  const { data, isLoading, isError } = useCotizaciones({ page: 1, perPage: 20 });
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);

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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Archive className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Historial de cotizaciones
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cotizaciones emitidas con el flujo anterior, solo para consulta.
            </p>
          </div>
        </div>
      </div>

      <LegacyQuotationsNotice />

      {/* Cotizaciones list */}
      <div className="flex flex-col gap-3">
        {data.data.length === 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No hay cotizaciones en el historial.
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

      {/* Cotización Detail Sheet */}
      <CotizacionDetailSheet
        open={selectedCotizacion !== null}
        onClose={() => setSelectedCotizacion(null)}
        cotizacion={selectedCotizacion}
      />
    </div>
  );
}
