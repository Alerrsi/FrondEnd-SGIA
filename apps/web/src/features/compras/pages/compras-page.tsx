import { useState } from 'react';
import { usePurchases } from '@sgia/api-client';
import { PurchaseStatus, type PurchaseOrder } from '@sgia/types';
import { AlertCircle, ArrowRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PurchaseStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canDo } from '@/features/auth/types/roles';
import { useAuth } from '@/features/auth/context/auth-context';
import { PurchaseDetailSheet } from '@/features/compras/components/purchase-detail-sheet';
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Órdenes de Compra
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Seguimiento de adquisiciones y recepción de mercancía.
            </p>
          </div>
          {canRequest && (
            <Link
              to="/solicitudes-compra"
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Nueva compra desde una solicitud
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
          className="h-8.5 w-full sm:w-72 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center font-mono text-xs text-zinc-500">
          Cargando órdenes de compra…
        </div>
      ) : isError || !data ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>No se pudieron cargar las órdenes de compra desde el servidor.</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500">
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
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-400">
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
                  className="cursor-pointer border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50"
                >
                  <td className="px-3 py-2 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {p.code ?? `#${p.id}`}
                  </td>
                  <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                    {p.supplier?.name ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{formatCLP(p.total_amount)}</td>
                  <td className="px-3 py-2">
                    <PurchaseStatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-500">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PurchaseDetailSheet
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        purchase={selected}
      />
    </div>
  );
}
