import type { Prestamo } from "@sgia/types";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateOnly } from "@/features/compras/lib/format";
import { LoanRequestStatusBadge } from "@/features/profesor/components/loan-request-status-badge";
import {
  canCancelLoanRequest,
  loanCareer,
  loanLaboratory,
  loanSchedule,
} from "@/features/profesor/lib/loan-request-format";
import { SECTION_LABEL_CLASS } from "@/components/ui/typography";
import { TABLE_HEAD_CLASS } from "@/components/ui/typography";

interface LoanRequestDetailSheetProps {
  loan: Prestamo | null;
  onClose: () => void;
  onCancelRequest: (loan: Prestamo) => void;
}

const labelClasses = SECTION_LABEL_CLASS;

/** Detalle de una solicitud propia: actividad, horario, laboratorio, insumos y motivo de rechazo. */
export function LoanRequestDetailSheet({
  loan,
  onClose,
  onCancelRequest,
}: LoanRequestDetailSheetProps) {
  const rows: Array<[string, string]> = loan
    ? [
        ["Carrera", loanCareer(loan)],
        ["Asignatura", loan.subject ?? loan.asignatura ?? "—"],
        [
          "Fecha de actividad",
          formatDateOnly(loan.loan_date ?? loan.fechaSolicitada),
        ],
        ["Horario", loanSchedule(loan)],
        ["Pañol", loan.storeroom?.name ?? "—"],
        ["Laboratorio", loanLaboratory(loan)],
      ]
    : [];

  return (
    <Sheet open={loan !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="sm:max-w-xl">
        {loan && (
          <>
            <SheetHeader>
              <SheetTitle>
                <span className="font-code">{loan.codigo ?? loan.code}</span>
                <LoanRequestStatusBadge estado={String(loan.estado)} />
              </SheetTitle>
              <SheetDescription>
                Solicitud de{" "}
                {loan.teacher?.name ?? loan.solicitanteNombre ?? "profesor"}
              </SheetDescription>
            </SheetHeader>

            <dl className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className={labelClasses}>{label}</dt>
                  <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {(loan.motivoRechazo ?? loan.rejection_reason) && (
              <p
                role="alert"
                className="rounded-md bg-danger-bg p-2.5 text-[13px] text-danger"
              >
                Motivo del rechazo:{" "}
                {loan.motivoRechazo ?? loan.rejection_reason}
              </p>
            )}

            <div>
              <h3 className={labelClasses}>Insumos solicitados</h3>
              <div className="mt-1.5 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className="px-3 py-2 font-medium">Producto</th>
                    <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {loan.items.map((item, index) => (
                    <tr key={item.id ?? index}>
                      <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                        {item.nombre ?? item.productoNombre}
                        {item.codigoBarras && (
                          <span className="ml-1.5 font-code text-xs text-zinc-500 dark:text-zinc-400">
                            {item.codigoBarras}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {item.cantidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {(loan.notes ?? loan.observaciones) && (
              <div>
                <h3 className={labelClasses}>Notas</h3>
                <p className="text-[13px] text-zinc-700 dark:text-zinc-300">
                  {loan.notes ?? loan.observaciones}
                </p>
              </div>
            )}

            {canCancelLoanRequest(loan) && (
              <Button
                variant="secondary"
                className="self-start"
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
