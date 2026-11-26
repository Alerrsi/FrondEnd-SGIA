import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileSpreadsheet, History } from 'lucide-react';
import {
  hasReportFilters,
  useExportReport,
  useReportPreview,
  type ReportParams,
} from '@sgia/api-client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SECTION_TITLE_CLASS } from '@/components/ui/typography';
import { useAuth } from '@/features/auth/context/auth-context';
import { downloadBlob } from '@/features/equipos/utils/download';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

import { REPORT_KIND_LABEL, reportScope, reportsForRole, type ReportDefinition } from '../catalog';
import { MyDownloads } from '../components/my-downloads';
import { ReportCatalog } from '../components/report-catalog';
import { ReportFilters } from '../components/report-filters';
import { ReportPreview } from '../components/report-preview';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { defaultPeriod, type PeriodValue } from '../lib/period';
import { buildReportRequest, defaultFilterValues, type ReportFilterValues } from '../lib/report-params';

/** Espera tras el último cambio de filtros antes de pedir la vista previa (decisión 5). */
export const PREVIEW_DEBOUNCE_MS = 400;

interface PreviewKey {
  path: string;
  params: ReportParams;
}

/**
 * Centro de reportes `/reportes` (BackEnd-SGIA/docs/centro-reportes.md): catálogo del rol a la izquierda y,
 * a la derecha, filtros, alcance, vista previa y «Descargar Excel» con los mismos parámetros de la vista.
 */
export default function ReportesPage() {
  const { user } = useAuth();
  const role = user?.rol ?? user?.role;
  const reports = useMemo(() => reportsForRole(role), [role]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [today] = useState(() => new Date());

  const requested = searchParams.get('reporte');
  const report: ReportDefinition | undefined = reports.find((r) => r.id === requested) ?? reports[0];

  const [period, setPeriod] = useState<PeriodValue>(() => defaultPeriod(today));
  // Valores por reporte: volver a uno ya visitado conserva sus filtros.
  const [valuesById, setValuesById] = useState<Record<string, ReportFilterValues>>({});
  const [downloadsOpen, setDownloadsOpen] = useState(false);

  const values = report ? (valuesById[report.id] ?? defaultFilterValues(report, today)) : {};
  const request = report ? buildReportRequest(report, values, period, today) : null;

  // La vista previa espera 400 ms tras el último cambio; ruta y filtros van juntos para no mezclar reportes.
  const currentKey = JSON.stringify({ path: report?.path ?? '', params: request?.params ?? {} } satisfies PreviewKey);
  const debouncedKey = useDebouncedValue(currentKey, PREVIEW_DEBOUNCE_MS);
  const previewKey = useMemo(() => JSON.parse(debouncedKey) as PreviewKey, [debouncedKey]);
  const settled = debouncedKey === currentKey;
  const blocked = request?.blocked ?? null;

  const preview = useReportPreview(previewKey.path, previewKey.params, {
    enabled: Boolean(report) && !blocked && previewKey.path !== '',
  });
  const exportMutation = useExportReport();

  const selectReport = (id: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('reporte', id);
        return next;
      },
      { replace: true },
    );
  };

  const changeFilter = (id: string, value: string) => {
    if (!report) return;
    setValuesById((prev) => ({ ...prev, [report.id]: { ...values, [id]: value } }));
  };

  // «Descargar» envía exactamente los parámetros de la vista previa: se habilita cuando ya se asentaron.
  const handleDownload = async () => {
    if (!report || blocked || !settled) return;
    const { path, params } = previewKey;
    const filtered = hasReportFilters(params);
    try {
      const file = await exportMutation.mutateAsync({ path, params, options: { fallbackName: report.filenamePrefix } });
      downloadBlob(file.blob, file.filename);
      toast.success(`Excel descargado (${filtered ? 'con filtros' : 'completo'})`);
      if (file.truncated) toast.warning('El reporte se cortó en 10.000 filas: acota los filtros');
    } catch (error) {
      toast.error({ title: 'No se pudo exportar el Excel', description: apiErrorToMessage(error) });
    }
  };

  const scopeText =
    preview.data?.info.find(([label]) => label === 'Alcance')?.[1] ?? (report ? reportScope(report, role) : '');

  return (
    // Desde 1024 px la página ocupa el alto de la ventana (barra de 56 px y margen del marco, como /ubicaciones):
    // el catálogo y la tabla se desplazan por dentro. En ventanas muy bajas manda el mínimo y se desplaza la página.
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-6.5rem)] lg:min-h-[520px]">
      <PageHeader
        icon={FileSpreadsheet}
        title="Reportes"
        description="Elige un reporte y su período, revisa la vista previa y descarga el Excel."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setDownloadsOpen(true)}>
            <History aria-hidden="true" className="h-3.5 w-3.5" />
            Mis descargas
          </Button>
        }
      />

      {!report ? (
        <EmptyState icon={FileSpreadsheet} title="Sin reportes para tu rol" description="Tu rol no tiene reportes Excel disponibles." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
          <ReportCatalog reports={reports} selectedId={report.id} onSelect={selectReport} />

          <section aria-labelledby="reporte-titulo" className="flex min-w-0 flex-col gap-3 lg:min-h-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="reporte-titulo" className={SECTION_TITLE_CLASS}>
                    {report.title}
                  </h2>
                  <Badge tone="neutral">{REPORT_KIND_LABEL[report.kind]}</Badge>
                </div>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{report.description}</p>
                <p className="text-[13px] text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Alcance:</span> {scopeText}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleDownload()}
                disabled={Boolean(blocked) || !settled || exportMutation.isPending}
                aria-busy={exportMutation.isPending || undefined}
                className="w-full shrink-0 sm:w-auto"
              >
                <Download aria-hidden="true" className="h-3.5 w-3.5" />
                {exportMutation.isPending ? 'Generando…' : 'Descargar Excel'}
              </Button>
            </div>

            <ReportFilters
              report={report}
              values={values}
              onChange={changeFilter}
              period={period}
              onPeriodChange={setPeriod}
              today={today}
            />

            <ReportPreview
              data={preview.data}
              isLoading={preview.isLoading}
              isUpdating={!settled || preview.isFetching}
              error={preview.error}
              onRetry={() => void preview.refetch()}
              blocked={blocked}
              className="lg:min-h-0 lg:flex-1"
            />
          </section>
        </div>
      )}

      <MyDownloads open={downloadsOpen} onOpenChange={setDownloadsOpen} />
    </div>
  );
}
