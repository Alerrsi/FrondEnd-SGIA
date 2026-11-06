import { useState } from 'react';
import { usePurchases } from '@sgia/api-client';
import { PurchaseStatus, type PurchaseOrder } from '@sgia/types';
import { AlertCircle, Plus, ShoppingCart } from 'lucide-react';
import { useUrlParam } from '@/lib/use-url-param';
import { useSearchParams } from 'react-router-dom';

import { PurchaseStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canDo } from '@/features/auth/types/roles';
import { useAuth } from '@/features/auth/context/auth-context';
import { PurchaseDetailSheet } from '@/features/compras/components/purchase-detail-sheet';
import { PurchaseFormDialog } from '@/features/compras/components/purchase-form-dialog';
import { formatCLP, formatDate } from '@/features/compras/lib/format';

const STATUS_FILTERS: Array<{ value: PurchaseStatus | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: PurchaseStatus.PENDIENTE, label: 'Pendientes' },
  { value: PurchaseStatus.EN_CAMINO, label: 'En camino' },
  { value: PurchaseStatus.COMPLETA, label: 'Completas' },
  { value: PurchaseStatus.CANCELADA, label: 'Canceladas' },
];

export default function ComprasPage() {
  const { user } = useAuth();
  const canCreate = canDo(user?.rol, 'createPurchase');
  const [searchParams, setSearchParams] = useSearchParams();
  const quotationParam = Number(searchParams.get('cotizacion')) || null;

  const [statusParam, setStatus] = useUrlParam('estado');
  const status = statusParam as PurchaseStatus | '';
  const [search, setSearch] = useUrlParam('q');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(quotationParam !== null && canCreate);

  const { data, isLoading, isError } = usePurchases({
    status: status || undefined,
    search: search.trim() || undefined,
    per_page: 50,
  });

  // El detalle se deriva del listado vivo para reflejar cambios tras invalidar caché.
  const selected: PurchaseOrder | null = data?.data.find((p) => p.id === selectedId) ?? null;

  const closeForm = () => {
    setFormOpen(false);
    if (quotationParam !== null) setSearchParams({}, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            data-sede-badge="true"
            className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2 py-0.5 text-xs font-mono font-medium text-brand-strong"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            SEDE TEMUCO · ADQUISICIONES
          </span>
          <span className="text-text-muted text-xs font-mono">/</span>
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
            Compras
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <ShoppingCart aria-hidden="true" className="h-5 w-5 text-text" />
              Órdenes de Compra
            </h1>
            <p className="text-xs text-text-muted">
              Seguimiento de adquisiciones y recepción de mercancía (REQ-08).
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setFormOpen(true)} className="text-xs">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nueva orden
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="group" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value || 'all'}
              size="sm"
              variant={status === f.value ? 'primary' : 'outline'}
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, guía o factura…"
          aria-label="Buscar órdenes"
          className="h-8.5 w-full sm:w-72 rounded-md border border-border bg-surface px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-info"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center font-mono text-xs text-text-muted">
          Cargando órdenes de compra…
        </div>
      ) : isError || !data ? (
        <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-bg p-4 text-xs font-medium text-danger">
          <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span>No se pudieron cargar las órdenes de compra desde el servidor.</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-xs">
            <thead className="bg-background text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Código</th>
                <th className="px-3 py-2 text-left font-semibold">Proveedor</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
                <th className="px-3 py-2 text-left font-semibold">Estado</th>
                <th className="px-3 py-2 text-left font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-text-muted">
                    No hay órdenes de compra para el filtro seleccionado.
                  </td>
                </tr>
              )}
              {data.data.map((p) => (
                <tr
                  key={p.id}
                  tabIndex={0}
                  onClick={() => setSelectedId(p.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedId(p.id)}
                  className="cursor-pointer border-t border-border hover:bg-surface-raised/50 focus:outline-none focus:bg-surface-raised"
                >
                  <td className="px-3 py-2 font-mono font-bold text-text">
                    {p.code ?? `#${p.id}`}
                  </td>
                  <td className="px-3 py-2 text-text">
                    {p.supplier?.name ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{formatCLP(p.total_amount)}</td>
                  <td className="px-3 py-2">
                    <PurchaseStatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-text-muted">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canCreate && (
        <PurchaseFormDialog
          open={formOpen}
          onClose={closeForm}
          initialQuotationId={quotationParam}
        />
      )}
      <PurchaseDetailSheet
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        purchase={selected}
      />
    </div>
  );
}
