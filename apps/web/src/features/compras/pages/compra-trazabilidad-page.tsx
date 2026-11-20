import { usePurchaseTrace } from '@sgia/api-client';
import type { PurchaseRequestStatus, PurchaseTrace } from '@sgia/types';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge, PurchaseStatusBadge, QuotationStatusBadge } from '@/components/ui/badge';
import { PurchaseRequestStatusBadge } from '@/features/solicitudes-compra/components/purchase-request-status-badge';
import { InvoiceIntakeStatusBadge } from '@/features/ingresos-factura/components/invoice-intake-status-badge';
import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { movementMeta } from '@/features/presupuestos/lib/movement-labels';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionLabel } from '@/components/ui/section-label';
import { SkeletonList } from '@/components/ui/skeleton-list';

function Step({ title, empty, children }: { title: string; empty?: string; children?: ReactNode }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border border-zinc-400 bg-white dark:border-zinc-500 dark:bg-zinc-900"
      />
      <SectionLabel as="h2">{title}</SectionLabel>
      {hasContent ? (
        <ul className="mt-1.5 flex flex-col gap-1.5">{children}</ul>
      ) : (
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{empty ?? 'Sin registros.'}</p>
      )}
    </li>
  );
}

const rowClasses =
  'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-[13px] text-zinc-700 dark:text-zinc-300';
const mutedClasses = 'text-zinc-500 dark:text-zinc-400';

const dateTime = (value: string) =>
  value
    ? new Date(value).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' })
    : '—';

function Timeline({ trace }: { trace: PurchaseTrace }) {
  const { purchase } = trace;
  return (
    <ol className="ml-1.5 flex flex-col gap-5 border-l border-zinc-200 pl-4 dark:border-zinc-800">
      <Step title="Orden de compra">
        <li className={rowClasses}>
          <span className="font-code text-xs text-zinc-900 dark:text-zinc-100">{purchase.code ?? `#${purchase.id}`}</span>
          <PurchaseStatusBadge status={purchase.status} />
          <span>{purchase.supplier?.name ?? 'Proveedor sin nombre'}</span>
          <span className="font-mono">{formatCLP(purchase.total_amount)}</span>
          <span className={mutedClasses}>{formatDate(purchase.created_at)}</span>
        </li>
      </Step>
      {trace.purchase_request && (
        <Step title="Solicitud de compra">
          <li className={rowClasses}>
            <Link to={`/compras/solicitudes/${trace.purchase_request.id}`} className="font-code text-xs text-accent underline-offset-2 hover:underline">
              {trace.purchase_request.code}
            </Link>
            <PurchaseRequestStatusBadge status={trace.purchase_request.status as PurchaseRequestStatus} />
          </li>
        </Step>
      )}
      <Step title="Cotizaciones" empty="Sin cotizaciones asociadas.">
        {/* Un solo arreglo: `Step` muestra el vacío según su largo. */}
        {[
          ...(trace.purchase_request?.quotations ?? []).map((q) => (
            <li key={`sc-${q.id}`} className={rowClasses}>
              <span>{q.supplier_name ?? 'Proveedor sin nombre'}</span>
              <span className="font-mono">{formatCLP(q.total)}</span>
              {q.selected && <Badge tone="available">Elegida</Badge>}
            </li>
          )),
          ...trace.quotations.map((q) => (
          <li key={q.id} className={rowClasses}>
            <span className="font-code text-xs text-zinc-900 dark:text-zinc-100">#{q.id}</span>
            <QuotationStatusBadge estado={q.estado} />
            <span>{q.proveedor ?? 'Múltiples proveedores'}</span>
            <span className={mutedClasses}>{formatDate(q.created_at)}</span>
          </li>
          )),
        ]}
      </Step>
      <Step title="Facturas" empty="Aún no hay facturas asociadas.">
        {trace.invoices.map((i) => (
          <li key={i.id} className={rowClasses}>
            <span className="font-code text-xs text-zinc-900 dark:text-zinc-100">{i.document_number ?? `Ingreso #${i.id}`}</span>
            <InvoiceIntakeStatusBadge status={i.status} />
            <span className="font-mono">{formatCLP(i.total_deducted)}</span>
            <span className={mutedClasses}>{formatDate(i.received_at ?? i.created_at)}</span>
          </li>
        ))}
      </Step>
      <Step title="Stock ingresado" empty="Todavía no ingresó stock (sin factura confirmada).">
        {trace.stock_entries.map((s) => (
          <li key={s.product_id} className={rowClasses}>
            <span>{s.name}</span>
            <span className="font-mono">+{s.quantity}</span>
          </li>
        ))}
      </Step>
      <Step title="Movimientos de presupuesto" empty="Sin movimientos de presupuesto.">
        {trace.budget_movements.map((m) => {
          const meta = movementMeta(m.type);
          return (
            <li key={m.id} className={rowClasses}>
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <span className="font-mono">{formatCLP(m.amount)}</span>
              <span className={mutedClasses}>{dateTime(m.created_at)}</span>
              {m.user?.name && <span className={mutedClasses}>{m.user.name}</span>}
              {m.notes && <span className={`w-full ${mutedClasses}`}>{m.notes}</span>}
            </li>
          );
        })}
      </Step>
    </ol>
  );
}

/** Cadena completa de una OC: cotizaciones → facturas → stock → presupuesto (REQ-08, auditoría visible). */
export default function CompraTrazabilidadPage() {
  const { id } = useParams();
  const purchaseId = Number(id) || undefined;
  const { data, isLoading, isError } = usePurchaseTrace(purchaseId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/compras/ordenes"
        className="-mb-3 inline-flex w-fit items-center gap-1 rounded text-[13px] text-zinc-500 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver a compras
      </Link>
      <PageHeader
        icon={ShoppingCart}
        title={`Trazabilidad de la orden ${data?.purchase.code ?? (purchaseId ? `#${purchaseId}` : '')}`}
        description="Todo lo que pasó con la orden: solicitud, cotizaciones, facturas, stock y presupuesto."
      />
      {isLoading && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <SkeletonList label="Cargando trazabilidad…" rows={5} columns={3} />
        </div>
      )}
      {(isError || (!isLoading && !data)) && (
        <ErrorState>No se pudo cargar la trazabilidad de la orden.</ErrorState>
      )}
      {data && <Timeline trace={data} />}
    </div>
  );
}
