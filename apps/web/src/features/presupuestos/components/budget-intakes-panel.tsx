import { useInvoiceIntakes } from '@sgia/api-client';
import { InvoiceIntakeStatus } from '@sgia/types';
import { Link } from 'react-router-dom';

import { formatCLP, formatDate } from '@/features/compras/lib/format';

/** Ingresos de factura confirmados que consumieron este presupuesto. */
export function BudgetIntakesPanel({ budgetId }: { budgetId: number }) {
  const { data, isLoading } = useInvoiceIntakes({
    annual_budget_id: budgetId,
    status: InvoiceIntakeStatus.CONFIRMADO,
    per_page: 50,
  });
  const rows = data?.data ?? [];

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-background font-mono text-xs uppercase tracking-wider text-text-muted">
            <th className="px-3 py-2 font-medium">N° factura</th>
            <th className="px-3 py-2 font-medium">Compra</th>
            <th className="px-3 py-2 font-medium">Recibida</th>
            <th className="px-3 py-2 text-right font-medium">Descontado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {isLoading && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                Cargando ingresos…
              </td>
            </tr>
          )}
          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                Sin facturas confirmadas.
              </td>
            </tr>
          )}
          {rows.map((intake) => (
            <tr key={intake.id}>
              <td className="px-3 py-2">
                <Link
                  to={`/ingresos-factura?ingreso=${intake.id}`}
                  className="font-mono text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
                >
                  {intake.document_number ?? `#${intake.id}`}
                </Link>
              </td>
              <td className="px-3 py-2 font-mono text-text-muted">
                {intake.purchase_id ? `#${intake.purchase_id}` : '—'}
              </td>
              <td className="px-3 py-2 font-mono text-text-muted">
                {formatDate(intake.received_at)}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {formatCLP(intake.total_deducted)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
