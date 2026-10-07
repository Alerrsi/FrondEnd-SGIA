import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import {
  useAprobarPrestamo,
  usePendingLoans,
  useRechazarPrestamo,
} from '@sgia/api-client';
import type { Prestamo } from '@sgia/types';

import { LoanStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

export default function ColaPrestamosPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = usePendingLoans();
  const aprobarMutation = useAprobarPrestamo();
  const rechazarMutation = useRechazarPrestamo();

  const loans = data?.data ?? [];

  // Metrics
  const totalPending = loans.length;
  const insufficientStockCount = useMemo(() => {
    return loans.filter((loan) =>
      loan.items.some((it) => (it.stockActual !== undefined ? it.stockActual < it.cantidad : false)),
    ).length;
  }, [loans]);

  const filteredLoans = useMemo(() => {
    if (!search.trim()) return loans;
    const term = search.toLowerCase().trim();
    return loans.filter((loan) => {
      const name = (loan.solicitanteNombre || '').toLowerCase();
      const code = (loan.codigo || '').toLowerCase();
      const subject = (loan.asignatura || '').toLowerCase();
      const room = (loan.sala || '').toLowerCase();
      return (
        name.includes(term) ||
        code.includes(term) ||
        subject.includes(term) ||
        room.includes(term)
      );
    });
  }, [loans, search]);

  const handleAprobar = async (loan: Prestamo) => {
    try {
      await aprobarMutation.mutateAsync({ id: loan.id });
      toast.success(`Solicitud #${loan.codigo ?? loan.id} aprobada y preparada con éxito`);
    } catch (err) {
      toast.error(apiErrorToMessage(err));
    }
  };

  const openRejectModal = (loan: Prestamo) => {
    setSelectedPrestamo(loan);
    setRejectionReason('');
    setReasonError(null);
    setRejectModalOpen(true);
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
        payload: { rejection_reason: rejectionReason.trim() },
      });
      toast.success(`Solicitud #${selectedPrestamo.codigo ?? selectedPrestamo.id} rechazada`);
      setRejectModalOpen(false);
      setSelectedPrestamo(null);
    } catch (err) {
      toast.error(apiErrorToMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header técnico con miga de pan */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-red-600 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-zinc-400 text-xs font-mono">/</span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Despacho Remoto
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Cola de Despacho de Solicitudes Remotas
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Solicitudes pre-reservadas por docentes desde la app móvil. Valida stock físico en pañol antes de confirmar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              <span>Actualizar</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate('/prestamos/mostrador')}
              className="text-xs gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Ir a Mesón Presencial</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Strip Compacta */}
      <div className="flex flex-wrap items-center divide-x divide-zinc-200 dark:divide-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2 pr-4">
          <Clock className="h-3 w-3 text-amber-500" />
          <span className="text-zinc-400 dark:text-zinc-500">Pendientes Despacho:</span>
          <strong className="text-zinc-900 dark:text-zinc-100 tabular-nums font-semibold">
            {totalPending}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-4">
          <AlertTriangle className={cn('h-3 w-3', insufficientStockCount > 0 ? 'text-rose-500' : 'text-zinc-400')} />
          <span className="text-zinc-400 dark:text-zinc-500">Con Conflicto de Stock:</span>
          <strong
            className={cn(
              'tabular-nums font-semibold',
              insufficientStockCount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-zinc-700 dark:text-zinc-300',
            )}
          >
            {insufficientStockCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 pl-4">
          <Boxes className="h-3 w-3 text-zinc-400" />
          <span className="text-zinc-400 dark:text-zinc-500">Modo:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Validación de Inventario Activa
          </span>
        </div>
      </div>

      {/* Barra de Filtro Rápido */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por docente, código, asignatura o sala…"
            className="h-8 w-full rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 pl-8 pr-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Mostrando {filteredLoans.length} solicitudes
        </span>
      </div>

      {/* Lista de Solicitudes */}
      {isLoading ? (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-xs font-mono text-zinc-500">
          <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-zinc-400" />
          Cargando cola de solicitudes remotas…
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-12 text-center text-xs font-mono text-zinc-500">
          <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-500 opacity-80" />
          No hay solicitudes remotas pendientes por despachar en este momento.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          {filteredLoans.map((loan) => {
            const hasStockIssue = loan.items.some(
              (it) => it.stockActual !== undefined && it.stockActual < it.cantidad,
            );

            return (
              <Card
                key={loan.id}
                className={cn(
                  'flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700',
                  hasStockIssue && 'border-amber-300/60 dark:border-amber-500/30',
                )}
              >
                <div className="flex flex-col gap-3">
                  {/* Fila Superior: Código, Docente y Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {loan.codigo || `#REQ-${loan.id}`}
                        </span>
                        <LoanStatusBadge estado={loan.estado} />
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate font-medium">
                        {loan.solicitanteNombre || loan.usuario?.name || 'Docente'}
                      </span>
                      {loan.solicitanteRun && (
                        <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
                          RUN: {loan.solicitanteRun}
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-300 uppercase">
                        {loan.tipo || 'DOCENTE'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata de la Clase / Taller */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <Boxes className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{loan.asignatura || loan.subject || 'Sin Asignatura'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200">
                        {loan.sala || loan.room || 'Taller General'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate col-span-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span>
                        {loan.fechaSolicitada || loan.loan_date || 'Hoy'}
                        {loan.time_block ? ` · ${loan.time_block}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Desglose de Ítems Solicitados */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                      Ítems Requeridos ({loan.items.length})
                    </span>
                    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60 border border-zinc-100 dark:border-zinc-800 rounded overflow-hidden">
                      {loan.items.map((item, idx) => {
                        const isUnderStock =
                          item.stockActual !== undefined && item.stockActual < item.cantidad;

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 text-xs font-mono bg-white dark:bg-zinc-900"
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="font-sans font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                {item.productoNombre || item.nombre || `Producto #${item.productoId}`}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                <span className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                                  {item.codigoBarras || `ID:${item.productoId}`}
                                </span>
                                {(item.sala || item.cajon) && (
                                  <span className="text-zinc-500">
                                    📍 {item.sala || 'Pañol'} {item.cajon ? `· ${item.cajon}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={cn(
                                  'font-semibold tabular-nums',
                                  isUnderStock
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-zinc-900 dark:text-zinc-100',
                                )}
                              >
                                {item.cantidad} un.
                              </span>
                              {item.stockActual !== undefined && (
                                <span className="text-[10px] text-zinc-400 tabular-nums">
                                  (disp: {item.stockActual})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Acciones de Despacho */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openRejectModal(loan)}
                    disabled={rechazarMutation.isPending || aprobarMutation.isPending}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    <span>Rechazar</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleAprobar(loan)}
                    disabled={aprobarMutation.isPending || rechazarMutation.isPending}
                    className="text-xs"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    <span>
                      {aprobarMutation.isPending ? 'Preparando…' : 'Aprobar / Preparar'}
                    </span>
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
        onClose={() => setRejectModalOpen(false)}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRejectModalOpen(false)}
          >
            Cancelar
          </Button>
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
