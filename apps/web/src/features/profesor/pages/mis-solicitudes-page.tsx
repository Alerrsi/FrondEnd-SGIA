import { useState } from "react";
import { useCancelLoanRequest, useMyLoanRequests } from "@sgia/api-client";
import type { Prestamo } from "@sgia/types";
import { ClipboardPlus, Plus, X } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { MobileRow } from "@/components/ui/mobile-row";
import { PageHeader } from "@/components/ui/page-header";
import { TableFrame } from "@/components/ui/table-frame";
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from "@/components/ui/table-styles";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { TABLE_HEAD_CLASS } from "@/components/ui/typography";
import { SegmentedFilter } from "@/components/shared/segmented-filter";
import { SkeletonList } from '@/components/ui/skeleton-list';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Todas" },
  { value: "pendiente", label: "En revisión" },
  { value: "en_proceso", label: "Para retirar" },
  { value: "procesado", label: "Entregadas" },
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

  const toolbar = (
    <TableToolbar>
      <SegmentedFilter
        label="Filtrar por estado"
        options={STATUS_FILTERS}
        value={status}
        onChange={setStatus}
      />
    </TableToolbar>
  );

  const mobile =
    !isLoading && !isError && loans.length > 0 ? (
      <ul>
        {loans.map((loan) => (
          <MobileRow
            key={loan.id}
            title={loan.subject ?? loan.asignatura ?? loanCareer(loan)}
            meta={`${formatDateOnly(loan.loan_date ?? loan.fechaSolicitada)} · ${loanSchedule(loan)} · ${loanLaboratory(loan)}`}
            trailing={<LoanRequestStatusBadge loan={loan} />}
            onClick={() => setDetail(loan)}
          />
        ))}
      </ul>
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ClipboardPlus}
        title="Mis solicitudes"
        description="Seguimiento de tus solicitudes de préstamo al pañol."
        actions={
          <Button onClick={() => navigate("/profesor/catalogo")}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nueva solicitud
          </Button>
        }
      />

      <TableFrame toolbar={toolbar} mobile={mobile}>
        {isLoading ? (
          <SkeletonList label="Cargando solicitudes…" rows={4} columns={4} />
        ) : isError ? (
          <div className="p-3">
            <ErrorState>No se pudieron cargar tus solicitudes.</ErrorState>
          </div>
        ) : loans.length === 0 ? (
          <EmptyState
            icon={ClipboardPlus}
            title="No hay solicitudes para el filtro seleccionado."
          />
        ) : (
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                {HEADERS.map((h, i) => (
                  <th
                    key={`${h}-${i}`}
                    className={i === 0 ? `${TH_CLASS} ${STICKY_COL_CLASS} max-md:bg-zinc-50` : TH_CLASS}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr
                  key={loan.id}
                  tabIndex={0}
                  onClick={() => setDetail(loan)}
                  onKeyDown={(e) => e.key === "Enter" && setDetail(loan)}
                  className={`${ROW_CLASS} cursor-pointer focus:outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-800/40`}
                >
                  <td className={`${TD_CLASS} ${STICKY_COL_CLASS} whitespace-nowrap`}>
                    <span className="font-code text-xs">{loan.codigo ?? loan.code}</span>
                  </td>
                  <td className={TD_CLASS}>{loanCareer(loan)}</td>
                  <td className={TD_CLASS}>{loan.subject ?? loan.asignatura ?? "—"}</td>
                  <td className={`${TD_CLASS} whitespace-nowrap font-mono`}>
                    {formatDateOnly(loan.loan_date ?? loan.fechaSolicitada)}
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap font-mono`}>{loanSchedule(loan)}</td>
                  <td className={TD_CLASS}>{loanLaboratory(loan)}</td>
                  <td className={TD_CLASS}>{loan.storeroom?.name ?? "—"}</td>
                  <td className={TD_CLASS}>
                    <LoanRequestStatusBadge loan={loan} />
                  </td>
                  <td className={`${TD_CLASS} text-right`}>
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
                        <X aria-hidden="true" className="h-3.5 w-3.5" />
                        Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableFrame>

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
