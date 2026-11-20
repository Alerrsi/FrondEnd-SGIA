import { useState } from 'react';
import { usePurchases } from '@sgia/api-client';
import { PurchaseStatus, type PurchaseOrder } from '@sgia/types';
import { ArrowRight, ShoppingCart } from 'lucide-react';

import { PurchaseStatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MobileRow } from '@/components/ui/mobile-row';
import { PageHeader } from '@/components/ui/page-header';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { ButtonLink } from '@/components/shared/button-link';
import { SegmentedFilter } from '@/components/shared/segmented-filter';
import { canDo } from '@/features/auth/types/roles';
import { useAuth } from '@/features/auth/context/auth-context';
import { PurchaseDetailSheet } from '@/features/compras/components/purchase-detail-sheet';
import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { CODE_CHIP_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { SkeletonList } from '@/components/ui/skeleton-list';

const STATUS_FILTERS: Array<{ value: PurchaseStatus | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: PurchaseStatus.PENDIENTE, label: 'Pendientes' },
  { value: PurchaseStatus.EN_CAMINO, label: 'En camino' },
  { value: PurchaseStatus.COMPLETA, label: 'Completas' },
  { value: PurchaseStatus.CANCELADA, label: 'Canceladas' },
];

export default function ComprasPage() {
  const { user } = useAuth();
  // Las OC nuevas nacen de una solicitud de compra (Fase 7: ya no se crean aquí).
  const canRequest = canDo(user?.rol, 'managePurchaseRequests');

  const [status, setStatus] = useState<PurchaseStatus | ''>('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading, isError } = usePurchases({
    status: status || undefined,
    search: search.trim() || undefined,
    per_page: 50,
  });

  // El detalle se deriva del listado vivo para reflejar cambios tras invalidar caché.
  const selected: PurchaseOrder | null = data?.data.find((p) => p.id === selectedId) ?? null;

  const toolbar = (
    <TableToolbar>
      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Buscar por código, guía o factura…"
        label="Buscar órdenes"
      />
      <SegmentedFilter
        label="Filtrar por estado"
        options={STATUS_FILTERS}
        value={status}
        onChange={setStatus}
      />
    </TableToolbar>
  );

  const orders = data?.data ?? [];
  const mobile =
    !isLoading && orders.length > 0 ? (
      <ul>
        {orders.map((p) => (
          <MobileRow
            key={p.id}
            title={<span className="font-code text-[13px]">{p.code ?? `#${p.id}`}</span>}
            meta={`${p.supplier?.name ?? '—'} · ${formatCLP(p.total_amount)} · ${formatDate(p.created_at)}`}
            trailing={<PurchaseStatusBadge status={p.status} />}
            onClick={() => setSelectedId(p.id)}
          />
        ))}
      </ul>
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ShoppingCart}
        title="Órdenes de compra"
        description="Órdenes emitidas a proveedores, su estado de envío y la recepción de la mercancía."
        actions={
          canRequest && (
            <ButtonLink to="/compras/solicitudes">
              Nueva compra desde una solicitud
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </ButtonLink>
          )
        }
      />

      {isError ? (
        <ErrorState>No se pudieron cargar las órdenes de compra desde el servidor.</ErrorState>
      ) : (
        <TableFrame toolbar={toolbar} mobile={mobile}>
          {isLoading || !data ? (
            <SkeletonList label="Cargando órdenes de compra…" columns={5} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No hay órdenes de compra para el filtro seleccionado."
            />
          ) : (
            <table className="w-full min-w-[720px]">
              <thead className={TABLE_HEAD_CLASS}>
                <tr>
                  <th className={`${TH_CLASS} ${STICKY_COL_CLASS} max-md:bg-zinc-50`}>Código</th>
                  <th className={TH_CLASS}>Proveedor</th>
                  <th className={`${TH_CLASS} text-right`}>Total</th>
                  <th className={TH_CLASS}>Estado</th>
                  <th className={TH_CLASS}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((p) => (
                  <tr
                    key={p.id}
                    tabIndex={0}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedId(p.id)}
                    className={`${ROW_CLASS} cursor-pointer focus:outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-800/40`}
                  >
                    <td className={`${TD_CLASS} ${STICKY_COL_CLASS} whitespace-nowrap`}>
                      <span className={CODE_CHIP_CLASS}>{p.code ?? `#${p.id}`}</span>
                    </td>
                    <td className={TD_CLASS}>{p.supplier?.name ?? '—'}</td>
                    <td className={`${TD_CLASS} text-right font-mono whitespace-nowrap`}>
                      {formatCLP(p.total_amount)}
                    </td>
                    <td className={TD_CLASS}>
                      <PurchaseStatusBadge status={p.status} />
                    </td>
                    <td className={`${TD_CLASS} font-mono whitespace-nowrap text-zinc-500 dark:text-zinc-400`}>
                      {formatDate(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableFrame>
      )}

      <PurchaseDetailSheet
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        purchase={selected}
      />
    </div>
  );
}
