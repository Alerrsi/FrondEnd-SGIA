import { useState } from "react";
import { useCancelLoanRequest, useMyLoanRequests } from "@sgia/api-client";
import type { Prestamo } from "@sgia/types";
import { AlertCircle, ClipboardPlus, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateOnly } from "@/features/compras/lib/format";
import { LoanRequestStatusBadge } from "@/features/profesor/components/loan-request-status-badge";
import { LoanRequestDetailSheet } from "@/features/profesor/components/loan-request-detail-sheet";
import {
  canCancelLoanRequest,
  loanCareer,
  loanLaboratory,
  loanSchedule,
} from "@/features/profesor/lib/loan-request-format";
import { apiErrorToMessage } from "@/lib/api-error";
import { toast } from "@/lib/toast";
import { PageHeading } from '@/components/ui/page-heading';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from "@/components/ui/typography";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "en_proceso", label: "En proceso" },
  { value: "procesado", label: "Procesadas" },
  { value: "rechazado", label: "Rechazadas" },
];

const HEADERS = [
  "Código",
  "Carrera",
  "Asignatura",
  "Fecha",
  "Horario",
  "Laboratorio",
  "Pañol",
  "Estado",
  "",
];

export default function MisSolicitudesPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<Prestamo | null>(null);
  const [toCancel, setToCancel] = useState<Prestamo | null>(null);
  const { data, isLoading, isError } = useMyLoanRequests({
    status: status || undefined,
    per_page: 50,
  });
  const cancel = useCancelLoanRequest();
  const loans = data ?? [];

  const confirmCancel = async () => {
    if (!toCancel) return;
    try {
      await cancel.mutateAsync(toCancel.id);
      toast.success("Solicitud cancelada.");
      setDetail(null);
    } catch (error) {
      // 422: ya no está pendiente; 403: no es suya.
      toast.error(apiErrorToMessage(error));
    } finally {
      setToCancel(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading icon={ClipboardPlus} title="Mis solicitudes">
          Seguimiento de tus solicitudes de préstamo al pañol.
        </PageHeading>
        <Button
          onClick={() => navigate("/profesor/catalogo")}
        >
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 dark:border-zinc-800 p-3">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={status === f.value ? "primary" : "outline"}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className={`py-12 ${STATE_TEXT_CLASS}`}>
            Cargando solicitudes…
          </div>
        ) : isError ? (
          <div className="m-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            No se pudieron cargar tus solicitudes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className={TABLE_HEAD_CLASS}>
                <tr>
                  {HEADERS.map((h, i) => (
                    <th key={`${h}-${i}`} className="px-4 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loans.length === 0 ? (
                  <tr>
                    <td
                      colSpan={HEADERS.length}
                      className={`px-4 py-10 ${STATE_TEXT_CLASS}`}
                    >
                      No hay solicitudes para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr
                      key={loan.id}
                      tabIndex={0}
                      onClick={() => setDetail(loan)}
                      onKeyDown={(e) => e.key === "Enter" && setDetail(loan)}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono">
                        {loan.codigo ?? loan.code}
                      </td>
                      <td className="px-4 py-2.5">{loanCareer(loan)}</td>
                      <td className="px-4 py-2.5">
                        {loan.subject ?? loan.asignatura ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono">
                        {formatDateOnly(loan.loan_date ?? loan.fechaSolicitada)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono">
                        {loanSchedule(loan)}
                      </td>
                      <td className="px-4 py-2.5">{loanLaboratory(loan)}</td>
                      <td className="px-4 py-2.5">
                        {loan.storeroom?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <LoanRequestStatusBadge estado={String(loan.estado)} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {canCancelLoanRequest(loan) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Cancelar ${loan.codigo ?? loan.code}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setToCancel(loan);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LoanRequestDetailSheet
        loan={detail}
        onClose={() => setDetail(null)}
        onCancelRequest={setToCancel}
      />
      <ConfirmDialog
        open={toCancel !== null}
        title="Cancelar solicitud"
        description={`¿Cancelar la solicitud ${toCancel?.codigo ?? toCancel?.code ?? ""}? El pañol dejará de prepararla.`}
        confirmLabel="Cancelar solicitud"
        cancelLabel="Volver"
        variant="danger"
        loading={cancel.isPending}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </div>
  );
}
