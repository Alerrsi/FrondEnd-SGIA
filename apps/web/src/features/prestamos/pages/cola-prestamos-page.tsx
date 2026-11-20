import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePendingLoans, useRechazarPrestamo } from '@sgia/api-client';
import type { Prestamo } from '@sgia/types';
import {
  Ban,
  ClipboardCheck,
  Calendar,
  Clock,
  FlaskConical,
  History,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  User,
} from 'lucide-react';

import { LoanStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogCloseButton, DialogFooter } from '@/components/ui/dialog';
import { LoanReviewDialog } from '@/features/prestamos/components/loan-review-dialog';
import { formatDateOnly } from '@/features/compras/lib/format';
import {
  loanCareer,
  loanLaboratory,
  loanSchedule,
  loanSubject,
  loanStoreroom,
  loanTeacher,
} from '@/features/prestamos/lib/loan-display';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { Cell } from '@/components/ui/cell';
import { CellGrid } from '@/components/ui/cell-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { FORM_CONTROL_BASE_CLASS } from '@/components/ui/form-control';
import { Metric } from '@/components/ui/metric';
import { PageHeader } from '@/components/ui/page-header';
import { TableSearch } from '@/components/ui/table-search';
import { CODE_CHIP_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';

export default function ColaPrestamosPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [reviewLoan, setReviewLoan] = useState<Prestamo | null>(null);

  // TanStack Query hooks
  const {
    data: pendingLoansResponse,
    isLoading,
    refetch,
  } = usePendingLoans(); // PAN-01 ve solo su pañol: lo aplica el backend.

  const rechazarMutation = useRechazarPrestamo();

  const rawLoans: Prestamo[] = pendingLoansResponse?.data ?? [];

  // Filtrado exclusivo de solicitudes pendientes de revisión o preparación
  const pendingLoans = rawLoans.filter((l) => {
    const estado = (l.estado || '').toLowerCase();
    return (
      estado === 'pendiente' ||
      estado === 'solicitado' ||
      estado === 'en_revision' ||
      estado === 'aprobado'
    );
  });

  // Filtrado reactivo por término de búsqueda (RUN docente, código, insumos)
  const filteredLoans = pendingLoans.filter((loan) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const codigoMatch = (loan.codigo || `#${loan.id}`).toLowerCase().includes(term);
    const docenteMatch =
      loanTeacher(loan).toLowerCase().includes(term) ||
      loan.solicitanteRun?.toLowerCase().includes(term) ||
      loanLaboratory(loan).toLowerCase().includes(term);
    const itemMatch = loan.items?.some(
      (item) =>
        item.nombre?.toLowerCase().includes(term) ||
        item.productoNombre?.toLowerCase().includes(term),
    );
    return codigoMatch || docenteMatch || itemMatch;
  });

  const overdueInQueue = rawLoans.filter((l) => (l.estado || '').toLowerCase() === 'vencido').length;

  const openRejectModal = (loan: Prestamo) => {
    setSelectedPrestamo(loan);
    setRejectionReason('');
    setReasonError(null);
    setRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedPrestamo(null);
    setRejectionReason('');
    setReasonError(null);
  };

  const handleConfirmRechazo = async () => {
    if (!selectedPrestamo) return;
    if (!rejectionReason.trim()) {
      setReasonError('El motivo de rechazo es obligatorio para notificar al docente.');
      return;
    }

    try {
      await rechazarMutation.mutateAsync({
        id: selectedPrestamo.id,
        payload: {
          rejection_reason: rejectionReason.trim(),
        },
      });
      toast.success(`Solicitud #${selectedPrestamo.codigo ?? selectedPrestamo.id} rechazada`);
      handleCloseRejectModal();
    } catch (err) {
      toast.error(apiErrorToMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Cola de despacho de solicitudes remotas"
        description="Solicitudes remotas de tu pañol enviadas por los docentes."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              Actualizar cola
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/prestamos/historial')}>
              <History aria-hidden="true" className="h-3.5 w-3.5" />
              Ver historial / auditoría
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/prestamos/registro-presencial')}>
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              Nuevo préstamo presencial
            </Button>
          </>
        }
      />

      <CellGrid columns={3} aria-label="Resumen de la cola">
        <Cell>
          <Metric
            label="Solicitudes por preparar"
            value={pendingLoans.length}
            tone={pendingLoans.length > 0 ? 'warning' : 'neutral'}
          />
        </Cell>
        <Cell>
          <Metric label="Total solicitudes en cola" value={rawLoans.length} />
        </Cell>
        <Cell>
          <Metric
            label="Vencidos / fuera de plazo"
            value={overdueInQueue}
            tone={overdueInQueue > 0 ? 'danger' : 'neutral'}
          />
        </Cell>
      </CellGrid>

      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Filtrar por código, docente, laboratorio o producto…"
        className="sm:max-w-md"
      />

      {/* Listado tipo Tarjetas Técnicas / Cola */}
      {isLoading ? (
        <div role="status" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Cargando cola de solicitudes…</span>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <EmptyState
            icon={Package}
            title={search ? 'Sin resultados para la búsqueda' : 'No hay solicitudes pendientes en la cola'}
            description={
              search
                ? 'Intenta con otro término de búsqueda o limpia el filtro.'
                : 'Cuando un docente solicite insumos, aparecerá en esta lista para preparación.'
            }
            action={
              search ? (
                <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                  Limpiar búsqueda
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLoans.map((loan) => {
            const docenteName = loanTeacher(loan);
            const actividad = [
              loan.loan_date ? formatDateOnly(loan.loan_date) : null,
              loanSchedule(loan) !== '—' ? loanSchedule(loan) : null,
            ]
              .filter(Boolean)
              .join(' · ');
            const docenteRun = loan.solicitanteRun || '—';
            const itemsCount = loan.items?.length || 0;
            const fechaStr =
              loan.created_at || loan.createdAt
                ? new Date((loan.created_at || loan.createdAt)!).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Fecha no registrada';

            return (
              <Card
                key={loan.id}
                className="flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Código + Estado */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-200 pb-2.5 dark:border-zinc-800">
                    <div>
                      <span className={CODE_CHIP_CLASS}>
                        {loan.codigo || `#${loan.id}`}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <Calendar aria-hidden="true" className="h-3 w-3" />
                        <span className="font-mono">{fechaStr}</span>
                      </div>
                    </div>
                    <LoanStatusBadge estado={String(loan.estado)} />
                  </div>

                  {/* Datos del Solicitante */}
                  <div className="mt-3 flex items-start gap-2.5 rounded-md bg-zinc-50 p-2.5 dark:bg-zinc-950/60">
                    <User aria-hidden="true" className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                        {docenteName}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        RUN: <span className="font-code">{docenteRun}</span>
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        Asignatura: {loanSubject(loan)} · Carrera: {loanCareer(loan)}
                      </span>
                    </div>
                  </div>

                  {/* Actividad: fecha y horario, laboratorio y pañol que la prepara */}
                  <dl className="mt-2 grid grid-cols-1 gap-1 text-[13px] text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-400" />
                      <dt className="sr-only">Actividad</dt>
                      <dd className="font-mono">
                        {actividad || 'Horario no informado'}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FlaskConical aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-400" />
                      <dt className="sr-only">Laboratorio</dt>
                      <dd className="truncate">{loanLaboratory(loan)}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-400" />
                      <dt className="sr-only">Pañol</dt>
                      <dd className="truncate">{loanStoreroom(loan)}</dd>
                    </div>
                  </dl>

                  {/* Insumos solicitados con micro-inspección de ubicación */}
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Insumos solicitados</span>
                      <span className="font-mono font-normal text-zinc-500 dark:text-zinc-400">
                        ({itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'})
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {loan.items?.map((it, idx) => {
                        const prodName =
                          it.nombre || it.productoNombre || `Insumo #${it.productoId}`;
                        const sala = it.sala;
                        const cajon = it.cajon;
                        const ubicacionStr = [sala, cajon].filter(Boolean).join(' · ') || null;

                        return (
                          <div
                            key={it.id ?? idx}
                            className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[13px] dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-zinc-800 dark:text-zinc-200">
                                {prodName}
                              </span>
                              {ubicacionStr && (
                                <span className="flex items-center gap-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                  <MapPin aria-hidden="true" className="h-3 w-3" />
                                  <span>{ubicacionStr}</span>
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 rounded-sm bg-zinc-100 px-1.5 py-0.5 font-mono text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              x{it.cantidad}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Observaciones del docente si existen */}
                  {loan.observaciones && (
                    <div className="mt-3 rounded-md bg-warn-bg p-2 text-[13px] text-warn">
                      <span className="font-medium">Nota del docente:</span> {loan.observaciones}
                    </div>
                  )}
                </div>

                {/* Acciones del Pañolero */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openRejectModal(loan)}
                    disabled={rechazarMutation.isPending}
                  >
                    <Ban aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
                    <span>Rechazar</span>
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setReviewLoan(loan)}
                    aria-label={`Revisar solicitud ${loan.codigo ?? loan.id}`}
                  >
                    <ClipboardCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>Revisar</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <LoanReviewDialog
        key={reviewLoan?.id ?? 'sin-revision'}
        loan={reviewLoan}
        onClose={() => setReviewLoan(null)}
        onReject={(loan) => {
          setReviewLoan(null);
          openRejectModal(loan);
        }}
      />

      {/* Modal Accesible de Rechazo con Motivo Obligatorio */}
      <Dialog
        open={rejectModalOpen}
        onClose={handleCloseRejectModal}
        hasUnsavedChanges={rejectionReason.trim().length > 0}
        confirmExitTitle="¿Descartar motivo de rechazo?"
        confirmExitDescription="Has escrito un motivo de rechazo. Si sales ahora, el texto ingresado se descartará."
        title="Rechazar solicitud remota"
        description="Indica el motivo por el cual no se puede preparar la solicitud. Será notificado al docente."
        size="sm"
      >
        <div className="flex flex-col gap-4 text-[13px]">
          <p className="text-zinc-600 dark:text-zinc-300">
            Solicitud seleccionada:{' '}
            <strong className="font-code font-normal text-zinc-900 dark:text-zinc-100">
              {selectedPrestamo?.codigo ?? `#${selectedPrestamo?.id}`}
            </strong>
          </p>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="rejection_reason"
              className={FIELD_LABEL_CLASS}
            >
              Motivo de rechazo <span className="text-danger">*</span>
            </label>
            <textarea
              id="rejection_reason"
              rows={3}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              placeholder="Ej. Insumos comprometidos en mantención preventiva, sin stock de multímetros…"
              className={`${FORM_CONTROL_BASE_CLASS} py-2`}
            />
            {reasonError && (
              <span className="text-xs text-danger">{reasonError}</span>
            )}
          </div>

          <DialogFooter>
            <DialogCloseButton disabled={rechazarMutation.isPending}>Cancelar</DialogCloseButton>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmRechazo}
              disabled={rechazarMutation.isPending || !rejectionReason.trim()}
            >
              {rechazarMutation.isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
