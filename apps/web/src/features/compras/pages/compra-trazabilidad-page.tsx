import { usePurchaseTrace } from '@sgia/api-client';
import type { PurchaseTrace } from '@sgia/types';
import { formatDateTime } from '@/lib/format';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge, PurchaseStatusBadge, QuotationStatusBadge } from '@/components/ui/badge';
import { InvoiceIntakeStatusBadge } from '@/components/ui/badge';
import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { movementMeta } from '@/features/presupuestos/lib/movement-labels';

function Step({ title, empty, children }: { title: string; empty?: string; children?: ReactNode }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <li className="relative pl-6">
      <span
        aria-hidden="true"
        className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border border-border bg-surface"
      />
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h2>
      {hasContent ? (
        <ul className="mt-1.5 flex flex-col gap-1.5">{children}</ul>
      ) : (
        <p className="mt-1 text-xs text-text-muted">{empty ?? 'Sin registros.'}</p>
      )}
    </li>
  );
}

const rowClasses =
  'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-surface px-3 py-2 text-xs';

const dateTime = formatDateTime;

function Timeline({ trace }: { trace: PurchaseTrace }) {
  const { purchase } = trace;
  return (
    <ol className="flex flex-col gap-5 border-l border-border pl-2">
      <Step title="Orden de compra">
        <li className={rowClasses}>
          <span className="font-mono font-medium">{purchase.code ?? `#${purchase.id}`}</span>
          <PurchaseStatusBadge status={purchase.status} />
          <span>{purchase.supplier?.name ?? 'Proveedor sin nombre'}</span>
          <span className="font-mono">{formatCLP(purchase.total_amount)}</span>
          <span className="text-text-muted">{formatDate(purchase.created_at)}</span>
        </li>
      </Step>
      <Step title="Cotizaciones" empty="Sin cotizaciones asociadas.">
        {trace.quotations.map((q) => (
          <li key={q.id} className={rowClasses}>
            <span className="font-mono font-medium">#{q.id}</span>
            <QuotationStatusBadge estado={q.estado} />
            <span>{q.proveedor ?? 'Múltiples proveedores'}</span>
            <span className="text-text-muted">{formatDate(q.created_at)}</span>
          </li>
        ))}
      </Step>
      <Step title="Facturas" empty="Aún no hay facturas asociadas.">
        {trace.invoices.map((i) => (
          <li key={i.id} className={rowClasses}>
            <span className="font-mono font-medium">{i.document_number ?? `Ingreso #${i.id}`}</span>
            <InvoiceIntakeStatusBadge status={i.status} />
            <span className="font-mono">{formatCLP(i.total_deducted)}</span>
            <span className="text-text-muted">{formatDate(i.received_at ?? i.created_at)}</span>
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
              <span className="text-text-muted">{dateTime(m.created_at)}</span>
              {m.user?.name && <span className="text-text-muted">{m.user.name}</span>}
              {m.notes && <span className="w-full text-text-muted">{m.notes}</span>}
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
    <div className="flex flex-col gap-4">
      <Link
        to="/compras"
        className="inline-flex w-fit items-center gap-1 rounded text-xs text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-info"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a compras
      </Link>
      <h1 className="text-xl font-bold tracking-tight text-text">
        Trazabilidad de la orden {data?.purchase.code ?? (purchaseId ? `#${purchaseId}` : '')}
      </h1>
      {isLoading && (
        <div role="status" className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando trazabilidad…
        </div>
      )}
      {(isError || (!isLoading && !data)) && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-4 w-4" />
          No se pudo cargar la trazabilidad de la orden.
        </p>
      )}
      {data && <Timeline trace={data} />}
    </div>
  );
}
