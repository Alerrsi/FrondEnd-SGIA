import { LoanStatusBadge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDateOnly } from '@/lib/format';
import {
  loanCareer,
  loanLaboratory,
  loanSchedule,
  loanSubject,
  loanStoreroom,
  loanTeacher,
} from '@/features/prestamos/lib/loan-display';
import { cn } from '@/lib/cn';
import type { Prestamo } from '@sgia/types';

/** Detalle y bitácora de un préstamo, en panel lateral. */
export function LoanDetailSheet({ loan, onClose }: { loan: Prestamo | null; onClose: () => void }) {
  return (
      <Sheet open={loan !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {loan && (
            <div className="flex flex-col gap-5 py-2">
              <SheetHeader className="text-left border-b border-border pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-text">
                    {loan.codigo ?? `#${loan.id}`}
                  </span>
                  <LoanStatusBadge estado={loan.estado} />
                </div>
                <SheetTitle className="text-base font-semibold text-text">
                  {loanTeacher(loan)}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs text-text-muted">
                  RUN: {loan.solicitanteRun || 'No registrado'} · Origen:{' '}
                  {loan.origen === 'remoto' ? 'Solicitud Remota (App)' : 'Presencial Mesón'}
                </SheetDescription>
              </SheetHeader>

              {/* Parámetros de la Clase */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-background p-3 rounded border border-border">
                <div>
                  <span className="text-text-muted text-xs">Asignatura</span>
                  <p className="font-medium text-text">
                    {loanSubject(loan)}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Carrera</span>
                  <p className="font-medium text-text">
                    {loanCareer(loan)}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Laboratorio</span>
                  <p className="font-medium text-text">
                    {loanLaboratory(loan)}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Pañol</span>
                  <p className="font-medium text-text">
                    {loanStoreroom(loan)}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Fecha de actividad</span>
                  <p className="font-medium text-text">
                    {loan.loan_date ? formatDateOnly(loan.loan_date) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Horario</span>
                  <p className="font-medium text-text">
                    {loanSchedule(loan) === '—'
                      ? 'No especificado'
                      : loanSchedule(loan)}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Días de Atraso</span>
                  <p
                    className={cn(
                      'font-medium tabular-nums',
                      loan.diasAtraso ? 'text-danger font-bold' : 'text-text-muted',
                    )}
                  >
                    {loan.diasAtraso
                      ? `${loan.diasAtraso} días`
                      : '0 días (Al día)'}
                  </p>
                </div>
              </div>

              {/* Lista de Ítems */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Ítems Prestados ({loan.items?.length ?? 0})
                </span>
                <div className="flex flex-col divide-y divide-border rounded border border-border bg-surface overflow-hidden">
                  {loan.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 text-xs font-mono"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-sans font-medium text-text">
                          {item.productoNombre || item.nombre || `Producto #${item.productoId}`}
                        </span>
                        <span className="text-xs text-text-muted">
                          SKU: {item.codigoBarras || '—'}
                        </span>
                      </div>
                      <span className="font-semibold tabular-nums text-text">
                        {item.cantidad ?? 1} un.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bitácora / Timeline de Eventos */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Bitácora y Trazabilidad
                </span>

                {loan.eventos && loan.eventos.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-border flex flex-col gap-4 py-1 ml-2">
                    {loan.eventos.map((evt, idx) => (
                      <div key={idx} className="relative flex flex-col gap-0.5 text-xs">
                        {/* Dot del timeline */}
                        <span className="absolute -left-[31px] top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-text-muted" />
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">
                            {evt.evento || evt.titulo}
                          </span>
                          <span className="font-mono text-xs text-text-muted">
                            {evt.fecha ? evt.fecha.slice(0, 16).replace('T', ' ') : ''}
                          </span>
                        </div>
                        {evt.usuario && (
                          <span className="font-mono text-xs text-text-muted">
                            Operador: {evt.usuario}
                          </span>
                        )}
                        {evt.descripcion && (
                          <p className="text-xs text-text-muted italic">{evt.descripcion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-text-muted italic">
                    Sin eventos registrados en la bitácora.
                  </p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
  );
}
