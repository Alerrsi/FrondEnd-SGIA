import { useEffect, useState } from 'react';
import { useCotizaciones } from '@sgia/api-client';
import type { Cotizacion } from '@sgia/types';
import { AlertCircle, Archive, FileText, Search, X } from 'lucide-react';

import { QuotationStatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CotizacionDetailSheet } from '@/features/cotizaciones/components/cotizacion-detail-sheet';
import { LegacyQuotationsNotice } from '@/features/cotizaciones/components/legacy-quotations-notice';
import { PageHeading } from '@/components/ui/page-heading';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { STATE_TEXT_CLASS } from '@/components/ui/typography';

/** Historial del flujo antiguo de cotizaciones: solo lectura (lista y detalle). */
export default function CotizacionesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useCotizaciones({
    page: 1,
    perPage: 20,
    search: debouncedSearch || undefined,
  });
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeading icon={Archive} title="Historial de cotizaciones">
            Cotizaciones emitidas con el flujo anterior, solo para consulta.
          </PageHeading>
        </div>
      </div>

      <LegacyQuotationsNotice />

      <div className="relative sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código de cotización u OC…"
          aria-label="Buscar cotizaciones"
          className={`${FILTER_CONTROL_CLASS} w-full py-1.5 pl-9 pr-9`}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Cotizaciones list */}
      <div className="flex flex-col gap-3">
        {isLoading && (
          <div className={`flex items-center gap-2 py-12 justify-center ${STATE_TEXT_CLASS}`}>
            <span>Cargando historial de cotizaciones…</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <span>No se pudo cargar el historial de cotizaciones desde el servidor.</span>
          </div>
        )}
        {data && data.data.length === 0 && (
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-zinc-400 dark:text-zinc-500 shadow-xs">
            {debouncedSearch
              ? `Sin resultados para "${debouncedSearch}".`
              : 'No hay cotizaciones en el historial.'}
          </div>
        )}
        {data?.data.map((cotizacion) => (
          <Card
            key={cotizacion.id}
            className="flex items-center justify-between gap-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            onClick={() => setSelectedCotizacion(cotizacion)}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-zinc-400" />
                <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {cotizacion.code ?? `#${cotizacion.id}`}
                </span>
                {cotizacion.purchase_code && (
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    → OC {cotizacion.purchase_code}
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {cotizacion.proveedor ?? 'Múltiples proveedores'} · {cotizacion.items.length} ítems
              </span>
              {cotizacion.createdAt && (
                <span className="text-[11px] font-mono text-zinc-400">
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
