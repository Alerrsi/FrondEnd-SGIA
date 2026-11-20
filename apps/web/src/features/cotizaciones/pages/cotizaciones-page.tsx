import { useEffect, useState } from 'react';
import { useCotizaciones } from '@sgia/api-client';
import type { Cotizacion } from '@sgia/types';
import { Archive, FileText } from 'lucide-react';

import { QuotationStatusBadge } from '@/components/ui/badge';
import { CotizacionDetailSheet } from '@/features/cotizaciones/components/cotizacion-detail-sheet';
import { LegacyQuotationsNotice } from '@/features/cotizaciones/components/legacy-quotations-notice';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MobileRow } from '@/components/ui/mobile-row';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { CODE_CHIP_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

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

  const rows = data?.data ?? [];
  const formatCreated = (value: string | undefined) =>
    value ? new Date(value).toLocaleDateString('es-CL') : '—';

  const toolbar = (
    <TableToolbar>
      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Buscar por código de cotización u OC…"
        label="Buscar cotizaciones"
      />
    </TableToolbar>
  );

  const mobile =
    rows.length > 0 ? (
      <ul>
        {rows.map((cotizacion) => (
          <MobileRow
            key={cotizacion.id}
            title={<span className="font-code text-[13px]">{cotizacion.code ?? `#${cotizacion.id}`}</span>}
            meta={`${cotizacion.proveedor ?? 'Múltiples proveedores'} · ${cotizacion.items.length} ítems`}
            trailing={<QuotationStatusBadge estado={cotizacion.estado} />}
            onClick={() => setSelectedCotizacion(cotizacion)}
          />
        ))}
      </ul>
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Archive}
        title="Historial de cotizaciones"
        description="Cotizaciones emitidas con el flujo anterior, solo para consulta."
      />

      <LegacyQuotationsNotice />

      {isError ? (
        <ErrorState>No se pudo cargar el historial de cotizaciones desde el servidor.</ErrorState>
      ) : (
        <TableFrame toolbar={toolbar} mobile={mobile}>
          {isLoading ? (
            <SkeletonList label="Cargando historial de cotizaciones…" columns={5} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                debouncedSearch
                  ? `Sin resultados para "${debouncedSearch}".`
                  : 'No hay cotizaciones en el historial.'
              }
            />
          ) : (
            <table className="w-full min-w-[720px]">
              <thead className={TABLE_HEAD_CLASS}>
                <tr>
                  <th className={`${TH_CLASS} ${STICKY_COL_CLASS} max-md:bg-zinc-50`}>Código</th>
                  <th className={TH_CLASS}>Orden de compra</th>
                  <th className={TH_CLASS}>Proveedor</th>
                  <th className={`${TH_CLASS} text-right`}>Ítems</th>
                  <th className={TH_CLASS}>Fecha</th>
                  <th className={TH_CLASS}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((cotizacion) => (
                  <tr
                    key={cotizacion.id}
                    tabIndex={0}
                    onClick={() => setSelectedCotizacion(cotizacion)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedCotizacion(cotizacion)}
                    className={`${ROW_CLASS} cursor-pointer focus:outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-800/40`}
                  >
                    <td className={`${TD_CLASS} ${STICKY_COL_CLASS} whitespace-nowrap`}>
                      <span className={CODE_CHIP_CLASS}>{cotizacion.code ?? `#${cotizacion.id}`}</span>
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap`}>
                      {cotizacion.purchase_code ? (
                        <span className="font-code text-xs">{cotizacion.purchase_code}</span>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400">—</span>
                      )}
                    </td>
                    <td className={TD_CLASS}>{cotizacion.proveedor ?? 'Múltiples proveedores'}</td>
                    <td className={`${TD_CLASS} text-right font-mono`}>{cotizacion.items.length}</td>
                    <td className={`${TD_CLASS} whitespace-nowrap font-mono text-zinc-500 dark:text-zinc-400`}>
                      {formatCreated(cotizacion.createdAt)}
                    </td>
                    <td className={TD_CLASS}>
                      <QuotationStatusBadge estado={cotizacion.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableFrame>
      )}

      {/* Cotización Detail Sheet */}
      <CotizacionDetailSheet
        open={selectedCotizacion !== null}
        onClose={() => setSelectedCotizacion(null)}
        cotizacion={selectedCotizacion}
      />
    </div>
  );
}
