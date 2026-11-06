import type { Prestamo } from '@sgia/types';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDateOnly } from '@/features/compras/lib/format';
import { LoanRequestStatusBadge } from '@/features/profesor/components/loan-request-status-badge';
import {
  canCancelLoanRequest,
  loanCareer,
  loanLaboratory,
  loanSchedule,
} from '@/features/profesor/lib/loan-request-format';

interface LoanRequestDetailSheetProps {
  loan: Prestamo | null;
  onClose: () => void;
  onCancelRequest: (loan: Prestamo) => void;
}

const labelClasses =
  'text-xs font-mono uppercase tracking-wider text-text-muted';

/** Detalle de una solicitud propia: actividad, horario, laboratorio, insumos y motivo de rechazo. */
export function LoanRequestDetailSheet({
  loan,
  onClose,
  onCancelRequest,
}: LoanRequestDetailSheetProps) {
  const rows: Array<[string, string]> = loan
    ? [
        ['Carrera', loanCareer(loan)],
        ['Asignatura', loan.subject ?? loan.asignatura ?? '—'],
        ['Fecha de actividad', formatDateOnly(loan.loan_date ?? loan.fechaSolicitada)],
        ['Horario', loanSchedule(loan)],
        ['Pañol', loan.storeroom?.name ?? '—'],
        ['Laboratorio', loanLaboratory(loan)],
      ]
    : [];

  return (
    <Sheet open={loan !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        {loan && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="font-mono">{loan.codigo ?? loan.code}</span>
                <LoanRequestStatusBadge estado={String(loan.estado)} />
              </SheetTitle>
              <SheetDescription className="text-xs text-text-muted">
                Solicitud de {loan.teacher?.name ?? loan.solicitanteNombre ?? 'profesor'}
              </SheetDescription>
            </SheetHeader>

            <dl className="grid grid-cols-2 gap-3">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className={labelClasses}>{label}</dt>
                  <dd className="text-xs text-text">{value}</dd>
                </div>
              ))}
            </dl>

            {(loan.motivoRechazo ?? loan.rejection_reason) && (
              <p
                role="alert"
                className="rounded-md border border-danger/30 bg-danger-bg p-2.5 text-xs text-danger"
              >
                Motivo del rechazo: {loan.motivoRechazo ?? loan.rejection_reason}
              </p>
            )}

            <div>
              <h3 className={labelClasses}>Insumos solicitados</h3>
              <table className="mt-1 w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-mono text-xs uppercase tracking-wider text-text-muted">
                    <th className="py-1.5 font-medium">Producto</th>
                    <th className="py-1.5 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loan.items.map((item, index) => (
                    <tr key={item.id ?? index}>
                      <td className="py-1.5 text-text">
                        {item.nombre ?? item.productoNombre}
                        {item.codigoBarras && (
                          <span className="ml-1 font-mono text-xs text-text-muted">
                            {item.codigoBarras}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums">{item.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(loan.notes ?? loan.observaciones) && (
              <div>
                <h3 className={labelClasses}>Notas</h3>
                <p className="text-xs text-text">
                  {loan.notes ?? loan.observaciones}
                </p>
              </div>
            )}

            {canCancelLoanRequest(loan) && (
              <Button
                variant="ghost"
                className="self-start text-xs text-danger hover:bg-rose-50"
                onClick={() => onCancelRequest(loan)}
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Cancelar solicitud
              </Button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
