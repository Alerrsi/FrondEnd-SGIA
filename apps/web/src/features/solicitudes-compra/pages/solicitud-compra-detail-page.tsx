import { useState } from 'react';
import {
  useApprovePurchaseRequest,
  useCancelPurchaseRequest,
  usePurchaseRequest,
} from '@sgia/api-client';
import { PurchaseRequestStatus } from '@sgia/types';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Package,
  Pencil,
  Send,
} from 'lucide-react';
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
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionTitle } from '@/components/ui/section-title';
import { TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { TABLE_HEAD_CLASS } from '@/components/ui/typography';

const BACK_LINK_CLASS =
  'inline-flex w-fit items-center gap-1 rounded text-[13px] text-zinc-500 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100';
const TERM_CLASS = 'text-[13px] text-zinc-500 dark:text-zinc-400';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div role="status" className="flex flex-col gap-6">
        <span className="sr-only">Cargando solicitud…</span>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="flex flex-col gap-3">
        <Link to="/compras/solicitudes" className={BACK_LINK_CLASS}>
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Volver a solicitudes
        </Link>
        <ErrorState>No se encontró la solicitud de compra.</ErrorState>
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
    <div className="flex flex-col gap-6">
      <Link to="/compras/solicitudes" className={`${BACK_LINK_CLASS} -mb-3`}>
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Solicitudes de compra
      </Link>

      <PageHeader
        icon={ClipboardCheck}
        title={<span className="font-code text-lg sm:text-xl">{request.code}</span>}
        aside={<PurchaseRequestStatusBadge status={request.status} />}
        description={
          <>
            Creada {formatDate(request.created_at)}
            {request.creator_name && ` por ${request.creator_name}`}
            {request.approved_at &&
              ` · aprobada ${formatDate(request.approved_at)}${request.approver_name ? ` por ${request.approver_name}` : ''}`}
          </>
        }
        actions={
          canManage && (
            <>
            {actions.can_edit && (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                Editar
              </Button>
            )}
            {actions.can_approve && (
              <Button onClick={() => setConfirmApprove(true)} disabled={approve.isPending}>
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                Aprobar
              </Button>
            )}
            {actions.can_send && (
              <Button onClick={() => setSendOpen(true)}>
                <Send aria-hidden="true" className="h-3.5 w-3.5" />
                Enviar a proveedores
              </Button>
            )}
            {actions.can_cancel && (
              <Button variant="secondary" onClick={() => setConfirmCancel(true)}>
                <Ban aria-hidden="true" className="h-3.5 w-3.5" />
                Cancelar solicitud
              </Button>
            )}
            </>
          )
        }
      />

      <PurchaseRequestStepper status={request.status} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <SectionTitle icon={Package}>Productos solicitados ({request.items.length})</SectionTitle>
          </header>
          <table className="w-full text-left">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th className={TH_CLASS}>Producto</th>
                <th className={`${TH_CLASS} text-right`}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                  <td className={`${TD_CLASS} text-zinc-800 dark:text-zinc-200`}>{item.product_name}</td>
                  <td className={`${TD_CLASS} text-right font-mono`}>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <dl className="grid grid-cols-1 content-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <dt className={TERM_CLASS}>Presupuesto</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {request.annual_budget
                ? `${careerLabel(request.annual_budget)} · ${request.annual_budget.year}`
                : `#${request.annual_budget_id}`}
            </dd>
          </div>
          {request.annual_budget && (
            <div>
              <dt className={TERM_CLASS}>Libre del presupuesto</dt>
              <dd className="font-mono">{formatCLP(request.annual_budget.free_amount)}</dd>
            </div>
          )}
          <div>
            <dt className={TERM_CLASS}>Enviada</dt>
            <dd className="font-mono">{formatDate(request.sent_at)}</dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <dt className={TERM_CLASS}>Notas</dt>
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
