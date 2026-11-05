import { useCallback } from 'react';
import {
  downloadIncidentReportPdf,
  downloadIncidentReportPhoto,
  downloadIncidentReportSignature,
  useIncidentReport,
  useUpdateIncidentReportStatus,
} from '@sgia/api-client';
import { INCIDENT_PROBLEM_LABELS, type IncidentStatus } from '@sgia/types';
import { FileDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDate } from '@/features/compras/lib/format';
import { AuthenticatedImage } from '@/features/novedades/components/authenticated-image';
import { IncidentStatusBadge } from '@/features/novedades/components/incident-status-badge';
import { INCIDENT_TRANSITION_LABELS } from '@/features/novedades/lib/incident-labels';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

interface IncidentDetailSheetProps {
  reportId: number | null;
  onClose: () => void;
}

const sectionClasses = 'rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5';
const headingClasses =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400';

/** Detalle de un informe de novedades; los botones de estado salen de `allowed_transitions`. */
export function IncidentDetailSheet({ reportId, onClose }: IncidentDetailSheetProps) {
  const { data: report, isLoading } = useIncidentReport(reportId ?? undefined);
  const updateStatus = useUpdateIncidentReportStatus();

  const loadSignature = useCallback(
    () => downloadIncidentReportSignature(reportId as number),
    [reportId],
  );
  const loadPhoto = useCallback(() => downloadIncidentReportPhoto(reportId as number), [reportId]);

  const changeStatus = async (status: IncidentStatus) => {
    if (!report) return;
    try {
      await updateStatus.mutateAsync({ id: report.id, status });
      toast.success('Estado del informe actualizado.');
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const downloadPdf = async () => {
    if (!report) return;
    try {
      const blob = await downloadIncidentReportPdf(report.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.code ?? `informe-${report.id}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const isLegacy = report?.is_legacy === true;

  return (
    <Sheet open={reportId !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading || !report ? (
          <div className="flex items-center justify-center py-16 text-xs text-zinc-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando informe…
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <span className="font-mono">{report.code ?? `Informe #${report.id}`}</span>
                <IncidentStatusBadge status={report.status} />
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                {isLegacy
                  ? 'Informe anterior al nuevo formulario.'
                  : `${report.teacher_name ?? 'Docente'} · ${report.subject ?? 'Sin asignatura'}`}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-col gap-3">
              {isLegacy ? (
                <div className={sectionClasses}>
                  <h3 className={headingClasses}>
                    {report.title ?? 'Falla reportada'}
                    {report.severity_label ? ` · ${report.severity_label}` : ''}
                  </h3>
                  <p className="text-xs whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {report.description}
                  </p>
                  {report.request_type && (
                    <p className="font-mono text-[11px] text-zinc-500">
                      Tipo: {report.request_type}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className={sectionClasses}>
                    <h3 className={headingClasses}>Datos</h3>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-[10px] text-zinc-400">Laboratorio</dt>
                        <dd className="text-zinc-800 dark:text-zinc-200">
                          {report.location?.nombre ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-zinc-400">Fecha</dt>
                        <dd className="font-mono text-zinc-800 dark:text-zinc-200">
                          {formatDate(report.report_date)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className={sectionClasses}>
                    <h3 className={headingClasses}>Problemas ({report.problems?.length ?? 0})</h3>
                    <ul className="space-y-2">
                      {(report.problems ?? []).map((problem) => (
                        <li key={problem.type} className="text-xs">
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {problem.label ?? INCIDENT_PROBLEM_LABELS[problem.type]}
                          </p>
                          <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
                            {problem.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {report.suggestion && (
                    <div className={sectionClasses}>
                      <h3 className={headingClasses}>Descripción o sugerencia</h3>
                      <p className="text-xs whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
                        {report.suggestion}
                      </p>
                    </div>
                  )}

                  {report.has_signature && (
                    <div className={sectionClasses}>
                      <h3 className={headingClasses}>Firma del profesor</h3>
                      <AuthenticatedImage
                        load={loadSignature}
                        alt="Firma del profesor"
                        className="max-h-24 rounded border border-zinc-200 dark:border-zinc-800 bg-white"
                      />
                      {report.signed_at && (
                        <p className="font-mono text-[11px] text-zinc-400">
                          Firmado {formatDate(report.signed_at)}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {report.has_evidence_photo && (
                <div className={sectionClasses}>
                  <h3 className={headingClasses}>Foto</h3>
                  <AuthenticatedImage
                    load={loadPhoto}
                    alt="Foto adjunta al informe"
                    className="max-h-64 rounded border border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              )}

              {(report.equipment_unit || report.product_id) && (
                <p className="font-mono text-[11px] text-zinc-500">
                  Equipo asociado:{' '}
                  {report.equipment_unit?.code ?? `producto #${report.product_id}`}
                </p>
              )}

              {report.pdf_url && (
                <Button variant="outline" onClick={() => void downloadPdf()} className="text-xs">
                  <FileDown className="h-4 w-4" />
                  Descargar PDF
                </Button>
              )}

              {(report.allowed_transitions ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                  {(report.allowed_transitions ?? []).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === 'descartado' || status === 'dado_de_baja' ? 'outline' : 'primary'}
                      disabled={updateStatus.isPending}
                      onClick={() => void changeStatus(status)}
                    >
                      {INCIDENT_TRANSITION_LABELS[status] ?? status}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
