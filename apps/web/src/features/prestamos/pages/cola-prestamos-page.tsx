import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAprobarPrestamo, usePendingLoans, useRechazarPrestamo } from '@sgia/api-client';
import type { Prestamo } from '@sgia/types';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Calendar,
  Clock,
  FlaskConical,
  History,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';

import { StoreroomSelect } from '@/components/shared/storeroom-select';
import { LoanStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/context/auth-context';
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

export default function ColaPrestamosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // PAN-01 ve solo su pañol (lo aplica el backend); AD-01 ve todos y puede filtrar.
  const isAdmin = user?.rol === 'AD-01';
  const [storeroomFilter, setStoreroomFilter] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  // TanStack Query hooks
  const {
    data: pendingLoansResponse,
    isLoading,
    refetch,
  } = usePendingLoans(isAdmin && storeroomFilter ? { storeroom_id: storeroomFilter } : undefined);

  const aprobarMutation = useAprobarPrestamo();
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
    <div className="flex flex-col gap-4">
      {/* Header técnico con miga de pan */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <span>Operaciones Pañol</span>
            <span>/</span>
            <span className="font-semibold text-text">
              Cola de Préstamos
            </span>
          </div>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-text">
            Cola de Despacho de Solicitudes Remotas
          </h1>
          <p className="text-xs text-text-muted">
            {isAdmin
              ? 'Solicitudes remotas de todos los pañoles; filtra por pañol para revisar una cola.'
              : 'Solicitudes remotas de tu pañol enviadas por los docentes.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Actualizar cola</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/prestamos/historial')}
            className="gap-1.5 text-xs"
          >
            <History aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Ver historial / auditoría</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/prestamos/registro-presencial')}
            className="gap-1.5 text-xs bg-brand hover:opacity-90 text-white"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Nuevo Préstamo Presencial</span>
          </Button>
        </div>
      </div>

      {/* Barra de métricas rápidas de la cola */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex items-center justify-between p-3 border-l-4 border-l-amber-500">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Solicitudes por preparar
            </span>
            <span className="mt-0.5 text-xl font-bold font-mono text-text">
              {pendingLoans.length}
            </span>
          </div>
          <Clock aria-hidden="true" className="h-5 w-5 text-amber-500" />
        </Card>

        <Card className="flex items-center justify-between p-3 border-l-4 border-l-blue-500">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Total solicitudes en cola
            </span>
            <span className="mt-0.5 text-xl font-bold font-mono text-text">
              {rawLoans.length}
            </span>
          </div>
          <Package aria-hidden="true" className="h-5 w-5 text-blue-500" />
        </Card>

        <Card className="flex items-center justify-between p-3 border-l-4 border-l-rose-500">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Vencidos / Fuera de plazo
            </span>
            <span className="mt-0.5 text-xl font-bold font-mono text-danger">
              {rawLoans.filter((l) => (l.estado || '').toLowerCase() === 'vencido').length}
            </span>
          </div>
          <AlertTriangle aria-hidden="true" className="h-5 w-5 text-rose-500" />
        </Card>
      </div>

      {/* Buscador reactivo y, para el administrador, filtro por pañol */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {isAdmin && (
          <StoreroomSelect
            value={storeroomFilter}
            onChange={setStoreroomFilter}
            aria-label="Filtro de pañol"
            className="h-8.5 rounded-md border border-border bg-surface px-2.5 text-xs text-text sm:w-56"
          />
        )}
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            placeholder="Filtrar por código, docente, laboratorio o producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 w-full rounded-md border border-border bg-surface pl-9 pr-3 font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Listado tipo Tarjetas Técnicas / Cola */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-md border border-border bg-surface p-8 text-text-muted text-xs">
          <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4 animate-spin text-text-muted" />
          <span>Cargando cola de solicitudes desde la API…</span>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface p-12 text-center">
          <Package aria-hidden="true" className="h-8 w-8 text-text-muted mb-2" />
          <h3 className="text-sm font-semibold text-text">
            {search
              ? 'Sin resultados para la búsqueda'
              : 'No hay solicitudes pendientes en la cola'}
          </h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            {search
              ? 'Intenta con otro término de búsqueda o limpia el filtro.'
              : 'Cuando un docente solicite insumos, aparecerá en esta lista para preparación.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
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
                className="flex flex-col justify-between p-4 border border-border hover:border-text-muted transition-colors shadow-xs"
              >
                <div>
                  {/* Top Bar: Código + Estado */}
                  <div className="flex items-start justify-between gap-2 border-b border-border pb-2.5">
                    <div>
                      <span className="font-mono text-xs font-bold text-text">
                        {loan.codigo || `#${loan.id}`}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                        <Calendar aria-hidden="true" className="h-3 w-3" />
                        <span>{fechaStr}</span>
                      </div>
                    </div>
                    <LoanStatusBadge estado={String(loan.estado)} />
                  </div>

                  {/* Datos del Solicitante */}
                  <div className="mt-3 flex items-start gap-2.5 rounded-md bg-background p-2.5">
                    <User aria-hidden="true" className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-text">
                        {docenteName}
                      </span>
                      <span className="block font-mono text-xs text-text-muted">
                        RUN: {docenteRun}
                      </span>
                      <span className="block text-xs text-text-muted">
                        Asignatura: {loanSubject(loan)} · Carrera: {loanCareer(loan)}
                      </span>
                    </div>
                  </div>

                  {/* Actividad: fecha y horario, laboratorio y pañol que la prepara */}
                  <dl className="mt-2 grid grid-cols-1 gap-1 text-xs text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <Clock aria-hidden="true" className="h-3 w-3 shrink-0 text-text-muted" />
                      <dt className="sr-only">Actividad</dt>
                      <dd className="font-mono tabular-nums">
                        {actividad || 'Horario no informado'}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FlaskConical aria-hidden="true" className="h-3 w-3 shrink-0 text-text-muted" />
                      <dt className="sr-only">Laboratorio</dt>
                      <dd className="truncate">{loanLaboratory(loan)}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package aria-hidden="true" className="h-3 w-3 shrink-0 text-text-muted" />
                      <dt className="sr-only">Pañol</dt>
                      <dd className="truncate">{loanStoreroom(loan)}</dd>
                    </div>
                  </dl>

                  {/* Insumos solicitados con micro-inspección de ubicación */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                      <span>Insumos solicitados</span>
                      <span className="font-mono text-text-muted">
                        ({itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'})
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {loan.items?.map((it, idx) => {
                        const prodName =
                          it.nombre || it.productoNombre || `Insumo #${it.productoId}`;
                        const sala = it.sala;
                        const cajon = it.cajon;
                        const ubicacionStr =
                          sala || cajon ? `${sala || 'Pañol'} · ${cajon || 'G-0'}` : null;

                        return (
                          <div
                            key={it.id ?? idx}
                            className="flex items-center justify-between gap-2 rounded border border-border bg-surface px-2.5 py-1.5 text-xs font-mono"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-text">
                                {prodName}
                              </span>
                              {ubicacionStr && (
                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                  <MapPin aria-hidden="true" className="h-2.5 w-2.5" />
                                  <span>{ubicacionStr}</span>
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 rounded bg-surface-raised px-1.5 py-0.5 text-xs font-bold text-text">
                              x{it.cantidad}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Observaciones del docente si existen */}
                  {loan.observaciones && (
                    <div className="mt-3 rounded border border-warn/30 bg-warn-bg p-2 text-xs text-warn">
                      <strong>Nota del docente:</strong> {loan.observaciones}
                    </div>
                  )}
                </div>

                {/* Acciones del Pañolero */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openRejectModal(loan)}
                    disabled={rechazarMutation.isPending}
                    className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 px-2.5"
                  >
                    <Ban aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
                    <span>Rechazar</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => aprobarMutation.mutateAsync({ id: loan.id })}
                    disabled={aprobarMutation.isPending}
                    className="text-xs bg-ink text-background hover:opacity-90 h-8 gap-1"
                  >
                    <span>Aprobar / Preparar</span>
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Accesible de Rechazo con Motivo Obligatorio */}
      <Dialog
        open={rejectModalOpen}
        onClose={handleCloseRejectModal}
        hasUnsavedChanges={rejectionReason.trim().length > 0}
        confirmExitTitle="¿Descartar motivo de rechazo?"
        confirmExitDescription="Has escrito un motivo de rechazo. Si sales ahora, el texto ingresado se descartará."
        title="Rechazar Solicitud Remota"
        description="Indica el motivo por el cual no se puede preparar la solicitud. Será notificado al docente."
        className="max-w-md"
      >
        <div className="flex flex-col gap-3 py-2 text-xs">
          <p className="text-text-muted">
            Solicitud seleccionada:{' '}
            <strong className="font-mono text-text">
              {selectedPrestamo?.codigo ?? `#${selectedPrestamo?.id}`}
            </strong>
          </p>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="rejection_reason"
              className="font-mono text-xs font-medium text-text"
            >
              Motivo de Rechazo <span className="text-rose-500">*</span>
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
              className="w-full rounded-md border border-border bg-surface p-2.5 font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none"
            />
            {reasonError && (
              <span className="text-xs text-danger">{reasonError}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <DialogCloseButton variant="outline" size="sm">
            Cancelar
          </DialogCloseButton>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirmRechazo}
            disabled={rechazarMutation.isPending || !rejectionReason.trim()}
          >
            {rechazarMutation.isPending ? 'Rechazando…' : 'Confirmar Rechazo'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
