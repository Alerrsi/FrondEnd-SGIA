import { useState } from 'react';
import {
  useApprovePurchaseRequest,
  useCancelPurchaseRequest,
  usePurchaseRequest,
} from '@sgia/api-client';
import { PurchaseRequestStatus } from '@sgia/types';
import { AlertCircle, ArrowLeft, Ban, CheckCircle2, Package, Pencil, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/features/auth/context/auth-context';
import { canDo } from '@/features/auth/types/roles';
import { formatCLP, formatDate } from '@/features/compras/lib/format';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';
import { ContactedSuppliersPanel } from '@/features/solicitudes-compra/components/contacted-suppliers-panel';
import { OrderPanel } from '@/features/solicitudes-compra/components/order-panel';
import { PurchaseRequestFormDialog } from '@/features/solicitudes-compra/components/purchase-request-form-dialog';
import { PurchaseRequestStatusBadge } from '@/features/solicitudes-compra/components/purchase-request-status-badge';
import { PurchaseRequestStepper } from '@/features/solicitudes-compra/components/purchase-request-stepper';
import { QuotationsPanel } from '@/features/solicitudes-compra/components/quotations-panel';
import { SendPurchaseRequestDialog } from '@/features/solicitudes-compra/components/send-purchase-request-dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

export default function SolicitudCompraDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { user } = useAuth();
  const canManage = canDo(user?.rol, 'managePurchaseRequests');
  const canRegisterInvoice = canDo(user?.rol, 'scanInvoice');

  const { data: request, isLoading, isError } = usePurchaseRequest(validId);
  const approve = useApprovePurchaseRequest();
  const cancel = useCancelPurchaseRequest();
  const [editOpen, setEditOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <div className="py-12 text-center font-mono text-xs text-zinc-500">Cargando solicitud…</div>
    );
  }

  if (isError || !request) {
    return (
      <div className="flex flex-col gap-3">
        <Link to="/solicitudes-compra" className="inline-flex items-center gap-1 text-xs text-zinc-500">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a solicitudes
        </Link>
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          No se encontró la solicitud de compra.
        </div>
      </div>
    );
  }

  const { actions } = request;
  const sentOrLater = request.suppliers.length > 0;
  const showQuotations =
    request.quotations.length > 0 ||
    request.status === PurchaseRequestStatus.ENVIADA ||
    request.status === PurchaseRequestStatus.COTIZADA;
  const showOrder = request.selected_quotation_id !== null || request.order !== null;

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(request.id);
      toast.success(`Solicitud ${request.code} aprobada. Ya puedes enviarla a proveedores.`);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setConfirmApprove(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync(request.id);
      toast.success(
        request.order
          ? `Solicitud cancelada. Se liberaron ${formatCLP(request.order.reserved_amount)} del presupuesto.`
          : 'Solicitud cancelada.',
      );
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    } finally {
      setConfirmCancel(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/solicitudes-compra"
        className="inline-flex w-fit items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Solicitudes de compra
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {request.code}
            </h1>
            <PurchaseRequestStatusBadge status={request.status} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Creada {formatDate(request.created_at)}
            {request.creator_name && ` por ${request.creator_name}`}
            {request.approved_at &&
              ` · aprobada ${formatDate(request.approved_at)}${request.approver_name ? ` por ${request.approver_name}` : ''}`}
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {actions.can_edit && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            )}
            {actions.can_approve && (
              <Button size="sm" onClick={() => setConfirmApprove(true)} disabled={approve.isPending}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aprobar
              </Button>
            )}
            {actions.can_send && (
              <Button size="sm" onClick={() => setSendOpen(true)}>
                <Send className="h-3.5 w-3.5" />
                Enviar a proveedores
              </Button>
            )}
            {actions.can_cancel && (
              <Button variant="outline" size="sm" onClick={() => setConfirmCancel(true)}>
                <Ban className="h-3.5 w-3.5" />
                Cancelar solicitud
              </Button>
            )}
          </div>
        )}
      </div>

      <PurchaseRequestStepper status={request.status} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <header className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Package className="h-4 w-4 text-zinc-400" />
              Productos solicitados ({request.items.length})
            </h2>
          </header>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/60 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40">
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 text-right font-medium">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {request.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{item.product_name}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <dl className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 text-xs shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <dt className="text-zinc-500">Presupuesto</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">
              {request.annual_budget
                ? `${careerLabel(request.annual_budget)} · ${request.annual_budget.year}`
                : `#${request.annual_budget_id}`}
            </dd>
          </div>
          {request.annual_budget && (
            <div>
              <dt className="text-zinc-500">Libre del presupuesto</dt>
              <dd className="font-mono">{formatCLP(request.annual_budget.free_amount)}</dd>
            </div>
          )}
          <div>
            <dt className="text-zinc-500">Enviada</dt>
            <dd className="font-mono">{formatDate(request.sent_at)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Notas</dt>
            <dd className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
              {request.notes || '—'}
            </dd>
          </div>
        </dl>
      </div>

      {sentOrLater && <ContactedSuppliersPanel request={request} canManage={canManage} />}
      {showQuotations && <QuotationsPanel request={request} canManage={canManage} />}
      {showOrder && (
        <OrderPanel
          request={request}
          canManage={canManage}
          canRegisterInvoice={canRegisterInvoice}
        />
      )}

      {canManage && actions.can_edit && (
        <PurchaseRequestFormDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          request={request}
        />
      )}
      {canManage && actions.can_send && (
        <SendPurchaseRequestDialog
          open={sendOpen}
          onClose={() => setSendOpen(false)}
          request={request}
        />
      )}
      <ConfirmDialog
        open={confirmApprove}
        title="Aprobar solicitud"
        description={`Se aprobará ${request.code} y se notificará al administrador. Después podrás enviarla a proveedores; ya no podrás editar sus productos.`}
        confirmLabel="Aprobar"
        loading={approve.isPending}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />
      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar solicitud"
        description={
          request.order
            ? `Se cancelará ${request.code} y se liberará la reserva de ${formatCLP(request.order.reserved_amount)}. No se puede deshacer.`
            : `Se cancelará ${request.code}. No se puede deshacer.`
        }
        confirmLabel="Cancelar solicitud"
        cancelLabel="Volver"
        variant="danger"
        loading={cancel.isPending}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
