import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAprobarPrestamo,
  usePendingLoans,
  useRechazarPrestamo,
} from '@sgia/api-client';
import type { Prestamo } from '@sgia/types';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Calendar,
  Clock,
  History,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';

import { LoanStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

export default function ColaPrestamosPage() {
  const navigate = useNavigate();
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
  } = usePendingLoans();

  const aprobarMutation = useAprobarPrestamo();
  const rechazarMutation = useRechazarPrestamo();

  const rawLoans: Prestamo[] = Array.isArray(pendingLoansResponse)
    ? pendingLoansResponse
    : ((pendingLoansResponse as any)?.data ?? []);

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
      loan.solicitanteNombre?.toLowerCase().includes(term) ||
      loan.usuario?.name?.toLowerCase().includes(term) ||
      loan.solicitanteRun?.toLowerCase().includes(term);
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
        } as any,
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-300">
            <span>Operaciones Pañol</span>
            <span>/</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Cola de Préstamos</span>
          </div>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Cola de Despacho de Solicitudes Remotas
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Revisión y entrega de solicitudes remotas enviadas por docentes desde la app móvil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Actualizar cola</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/prestamos/historial')}
            className="gap-1.5 text-xs"
          >
            <History className="h-3.5 w-3.5" />
            <span>Ver historial / auditoría</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/prestamos/registro-presencial')}
            className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo Préstamo Presencial</span>
          </Button>
        </div>
      </div>

      {/* Barra de métricas rápidas de la cola */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex items-center justify-between p-3 border-l-4 border-l-amber-500">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Solicitudes por preparar
            </span>
            <span className="mt-0.5 text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {pendingLoans.length}
            </span>
          </div>
          <Clock className="h-5 w-5 text-amber-500" />
        </Card>

        <Card className="flex items-center justify-between p-3 border-l-4 border-l-blue-500">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total solicitudes en cola
            </span>
            <span className="mt-0.5 text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {rawLoans.length}
            </span>
          </div>
          <Package className="h-5 w-5 text-blue-500" />
        </Card>

        <Card className="flex items-center justify-between p-3 border-l-4 border-l-rose-500">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Vencidos / Fuera de plazo
            </span>
            <span className="mt-0.5 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {rawLoans.filter((l) => (l.estado || '').toLowerCase() === 'vencido').length}
            </span>
          </div>
          <AlertTriangle className="h-5 w-5 text-rose-500" />
        </Card>
      </div>

      {/* Buscador reactivo */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Filtrar por código de solicitud, RUN de docente o nombre de producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8.5 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none"
        />
      </div>

      {/* Listado tipo Tarjetas Técnicas / Cola */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-zinc-500 text-xs">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
          <span>Cargando cola de solicitudes desde la API…</span>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <Package className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {search ? 'Sin resultados para la búsqueda' : 'No hay solicitudes pendientes en la cola'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            {search
              ? 'Intenta con otro término de búsqueda o limpia el filtro.'
              : 'Cuando un docente solicite insumos desde su app móvil, aparecerá en esta lista para preparación.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {filteredLoans.map((loan) => {
            const docenteName = loan.solicitanteNombre || loan.usuario?.name || 'Docente no registrado';
            const docenteRun = loan.solicitanteRun || '—';
            const itemsCount = loan.items?.length || 0;
            const fechaStr = loan.created_at || loan.createdAt
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
                className="flex flex-col justify-between p-4 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs"
              >
                <div>
                  {/* Top Bar: Código + Estado */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                    <div>
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {loan.codigo || `#${loan.id}`}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{fechaStr}</span>
                      </div>
                    </div>
                    <LoanStatusBadge estado={String(loan.estado)} />
                  </div>

                  {/* Datos del Solicitante */}
                  <div className="mt-3 flex items-start gap-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950/60 p-2.5">
                    <User className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {docenteName}
                      </span>
                      <span className="block font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        RUN: {docenteRun}
                      </span>
                      {loan.asignatura && (
                        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                          {loan.asignatura}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Insumos solicitados con micro-inspección de ubicación */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                      <span>Insumos solicitados</span>
                      <span className="font-mono text-zinc-600 dark:text-zinc-400">({itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'})</span>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {loan.items?.map((it, idx) => {
                        const prodName = it.nombre || it.productoNombre || `Insumo #${it.productoId}`;
                        const sala = it.sala;
                        const cajon = it.cajon;
                        const ubicacionStr = sala || cajon ? `${sala || 'Pañol'} · ${cajon || 'G-0'}` : null;

                        return (
                          <div
                            key={it.id ?? idx}
                            className="flex items-center justify-between gap-2 rounded border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-zinc-800 dark:text-zinc-200">
                                {prodName}
                              </span>
                              {ubicacionStr && (
                                <span className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
                                  <MapPin className="h-2.5 w-2.5" />
                                  <span>{ubicacionStr}</span>
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                              x{it.cantidad}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Observaciones del docente si existen */}
                  {loan.observaciones && (
                    <div className="mt-3 rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-2 text-[11px] text-amber-800 dark:text-amber-300">
                      <strong>Nota del docente:</strong> {loan.observaciones}
                    </div>
                  )}
                </div>

                {/* Acciones del Pañolero */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openRejectModal(loan)}
                    disabled={rechazarMutation.isPending}
                    className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 h-8 px-2.5"
                  >
                    <Ban className="h-3.5 w-3.5 mr-1" />
                    <span>Rechazar</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => aprobarMutation.mutateAsync({ id: loan.id })}
                    disabled={aprobarMutation.isPending}
                    className="text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 h-8 gap-1"
                  >
                    <span>Aprobar / Preparar</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
          <p className="text-zinc-600 dark:text-zinc-300">
            Solicitud seleccionada:{' '}
            <strong className="font-mono text-zinc-900 dark:text-zinc-100">
              {selectedPrestamo?.codigo ?? `#${selectedPrestamo?.id}`}
            </strong>
          </p>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="rejection_reason"
              className="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300"
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
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            {reasonError && (
              <span className="text-xs text-rose-600 dark:text-rose-400">{reasonError}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
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
