import { useState } from "react";
import { useMyIncidentReports } from "@sgia/api-client";
import {
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { IncidentDetailSheet } from "@/features/novedades/components/incident-detail-sheet";
import { IncidentStatusBadge } from "@/features/novedades/components/incident-status-badge";
import { NewIncidentDialog } from "@/features/profesor/components/new-incident-dialog";
import { formatDateOnly } from "@/features/compras/lib/format";
import { toast } from "@/lib/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { MobileRow } from "@/components/ui/mobile-row";
import { PageHeader } from "@/components/ui/page-header";
import { TableFrame } from "@/components/ui/table-frame";
import { ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from "@/components/ui/table-styles";
import { TABLE_HEAD_CLASS } from "@/components/ui/typography";
import { SkeletonList } from '@/components/ui/skeleton-list';

export default function MisNovedadesPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, isLoading, isError } = useMyIncidentReports({
    page,
    per_page: 15,
  });
  const meta = data?.meta;

  const reports = data?.data ?? [];

  const footer =
    meta && meta.lastPage > 1 ? (
      <>
        <span className="font-mono">
          Página {meta.currentPage} de {meta.lastPage}
        </span>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Página siguiente"
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </>
    ) : undefined;

  const mobile =
    !isLoading && !isError && reports.length > 0 ? (
      <ul>
        {reports.map((report) => (
          <MobileRow
            key={report.id}
            title={report.subject ?? report.title ?? "—"}
            meta={`${report.location?.nombre ?? "—"} · ${formatDateOnly(report.report_date ?? report.created_at)}`}
            trailing={<IncidentStatusBadge status={report.status} />}
            onClick={() => setOpenId(report.id)}
          />
        ))}
      </ul>
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={FileWarning}
        title="Novedades"
        description="Informes de fallas y faltantes que has reportado."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nuevo informe
          </Button>
        }
      />

      <TableFrame footer={footer} mobile={mobile}>
        {isLoading ? (
          <SkeletonList label="Cargando informes…" rows={4} columns={3} />
        ) : isError ? (
          <div className="p-3">
            <ErrorState>No se pudieron cargar tus informes.</ErrorState>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState icon={FileWarning} title="Aún no has enviado informes." />
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                {["Código", "Asignatura", "Lugar", "Problemas", "Fecha", "Estado"].map((h, i) => (
                  <th
                    key={h}
                    className={i === 0 ? `${TH_CLASS} ${STICKY_COL_CLASS} max-md:bg-zinc-50` : TH_CLASS}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  tabIndex={0}
                  onClick={() => setOpenId(report.id)}
                  onKeyDown={(e) => e.key === "Enter" && setOpenId(report.id)}
                  className={`${ROW_CLASS} cursor-pointer focus:outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-800/40`}
                >
                  <td className={`${TD_CLASS} ${STICKY_COL_CLASS} whitespace-nowrap`}>
                    <span className="font-code text-xs">{report.code ?? `#${report.id}`}</span>
                  </td>
                  <td className={TD_CLASS}>{report.subject ?? report.title ?? "—"}</td>
                  <td className={TD_CLASS}>{report.location?.nombre ?? "—"}</td>
                  <td className={`${TD_CLASS} font-mono`}>{report.problems?.length ?? 0}</td>
                  <td className={`${TD_CLASS} whitespace-nowrap font-mono`}>
                    {formatDateOnly(report.report_date ?? report.created_at)}
                  </td>
                  <td className={TD_CLASS}>
                    <IncidentStatusBadge status={report.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableFrame>

      <NewIncidentDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(code) =>
          toast.success(
            code ? `Informe ${code} registrado.` : "Informe registrado.",
          )
        }
      />
      <IncidentDetailSheet
        reportId={openId}
        onClose={() => setOpenId(null)}
        readOnly
      />
    </div>
  );
}
