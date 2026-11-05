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
import { LoanRequestStatusBadge } from '@/features/profesor/components/loan-request-status-badge';
import {
  canCancelLoanRequest,
  formatDateOnly,
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
  'text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400';

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
              <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Solicitud de {loan.teacher?.name ?? loan.solicitanteNombre ?? 'profesor'}
              </SheetDescription>
            </SheetHeader>

            <dl className="grid grid-cols-2 gap-3">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className={labelClasses}>{label}</dt>
                  <dd className="text-xs text-zinc-800 dark:text-zinc-200">{value}</dd>
                </div>
              ))}
            </dl>

            {(loan.motivoRechazo ?? loan.rejection_reason) && (
              <p
                role="alert"
                className="rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-2.5 text-xs text-rose-700 dark:text-rose-300"
              >
                Motivo del rechazo: {loan.motivoRechazo ?? loan.rejection_reason}
              </p>
            )}

            <div>
              <h3 className={labelClasses}>Insumos solicitados</h3>
              <table className="mt-1 w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="py-1.5 font-medium">Producto</th>
                    <th className="py-1.5 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {loan.items.map((item, index) => (
                    <tr key={item.id ?? index}>
                      <td className="py-1.5 text-zinc-800 dark:text-zinc-200">
                        {item.nombre ?? item.productoNombre}
                        {item.codigoBarras && (
                          <span className="ml-1 font-mono text-[11px] text-zinc-400">
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
                <p className="text-xs text-zinc-700 dark:text-zinc-300">
                  {loan.notes ?? loan.observaciones}
                </p>
              </div>
            )}

            {canCancelLoanRequest(loan) && (
              <Button
                variant="ghost"
                className="self-start text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                onClick={() => onCancelRequest(loan)}
              >
                <Trash2 className="h-4 w-4" />
                Cancelar solicitud
              </Button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
