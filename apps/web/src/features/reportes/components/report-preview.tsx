import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { AlertTriangle, Loader2, Table2 } from 'lucide-react';
import type { ReportPreview as ReportPreviewData, ReportPreviewSheet } from '@sgia/api-client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TD_COMPACT_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { STATE_TEXT_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';

import { formatReportCell, groupThousands, isNumericType } from '../lib/format-cell';

const INFO_TAB = '__info__';

const TAB_TRIGGER_CLASS =
  '-mb-px shrink-0 cursor-pointer border-b-2 border-transparent px-3 py-2 text-[13px] font-medium whitespace-nowrap text-zinc-500 transition-colors duration-150 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 data-[state=active]:border-accent data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100';

export interface ReportPreviewProps {
  data: ReportPreviewData | undefined;
  isLoading: boolean;
  /** Pidiendo una vista previa nueva (la anterior sigue visible). */
  isUpdating: boolean;
  error: unknown;
  onRetry: () => void;
  /** Motivo por el que no se puede pedir la vista previa (período obligatorio). */
  blocked?: string | null;
}

function SheetTable({ sheet }: { sheet: ReportPreviewSheet }) {
  if (sheet.rows.length === 0) {
    return <p className={cn(STATE_TEXT_CLASS, 'py-10')}>Sin filas con estos filtros.</p>;
  }
  const cellClass = (i: number) => {
    const type = sheet.types[i];
    return cn(
      TD_COMPACT_CLASS,
      'whitespace-nowrap py-1.5',
      isNumericType(type) && 'text-right font-mono',
      (type === 'date' || type === 'datetime' || type === 'year') && 'font-mono',
    );
  };
  return (
    <table className="w-full border-collapse text-left">
      <thead className={TABLE_HEAD_CLASS}>
        <tr>
          {sheet.headers.map((h, i) => (
            <th key={`${h}-${i}`} scope="col" className={cn(TH_CLASS, 'px-3 py-2', isNumericType(sheet.types[i]) && 'text-right')}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sheet.rows.map((row, r) => (
          <tr key={r} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
            {sheet.headers.map((_, i) => (
              <td key={i} className={cellClass(i)}>
                {formatReportCell(row[i] ?? null, sheet.types[i])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {sheet.totals && (
        <tfoot>
          {/* Fila de totales en «negrita» del sistema (500; nunca 700). */}
          <tr data-testid="report-totals" className="border-t border-zinc-300 bg-zinc-50 font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100">
            {sheet.headers.map((_, i) => (
              <td key={i} className={cn(cellClass(i), 'font-medium text-zinc-900 dark:text-zinc-100')}>
                {formatReportCell(sheet.totals?.[i] ?? null, sheet.types[i])}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}

/**
 * Vista previa del reporte (docs/centro-reportes.md, decisiones 4 y 5): una pestaña por hoja (y la hoja
 * «Info»), tabla con el formato del Excel, «Mostrando 20 de N filas» y avisos de corte. Mientras llega una
 * vista nueva se mantiene la anterior, así no parpadea al cambiar filtros.
 */
export function ReportPreview({ data, isLoading, isUpdating, error, onRetry, blocked }: ReportPreviewProps) {
  const [tab, setTab] = useState<string>('');

  if (blocked) {
    return <EmptyState icon={Table2} title="Falta el período" description={blocked} className="rounded-lg border border-zinc-200 dark:border-zinc-800" />;
  }

  if (error && !data) {
    return (
      <ErrorState
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        }
      >
        No se pudo cargar la vista previa: {apiErrorToMessage(error)}
      </ErrorState>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <Skeleton className="h-7 w-64" label="Cargando vista previa…" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  const sheets = data.sheets;
  const active = tab === INFO_TAB || sheets.some((s) => s.name === tab) ? tab : (sheets[0]?.name ?? INFO_TAB);
  const totalCut = data.truncated || sheets.some((s) => s.truncated);

  return (
    <section aria-label="Vista previa" aria-busy={isUpdating || undefined} className="flex min-w-0 flex-col gap-2">
      {totalCut && (
        <p role="status" className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-2 text-[13px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-accent" />
          El Excel se cortará en 10.000 filas por hoja: acota los filtros para tenerlo completo.
        </p>
      )}
      <Tabs.Root value={active} onValueChange={setTab} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-200 pr-3 dark:border-zinc-800">
          <Tabs.List aria-label="Hojas del reporte" className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-1">
            {sheets.map((s) => (
              <Tabs.Trigger key={s.name} value={s.name} className={TAB_TRIGGER_CLASS}>
                {s.name}
              </Tabs.Trigger>
            ))}
            <Tabs.Trigger value={INFO_TAB} className={TAB_TRIGGER_CLASS}>
              Info
            </Tabs.Trigger>
          </Tabs.List>
          {isUpdating && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
              Actualizando…
            </span>
          )}
        </div>
        {sheets.map((s) => (
          <Tabs.Content key={s.name} value={s.name} className="flex min-w-0 flex-col focus:outline-none">
            <div className="max-h-[420px] min-w-0 overflow-auto [&_thead]:sticky [&_thead]:top-0">
              <SheetTable sheet={s} />
            </div>
            <p className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <span>
                Mostrando {groupThousands(s.rows.length)} de {groupThousands(s.total_rows)}{' '}
                {s.total_rows === 1 ? 'fila' : 'filas'}
              </span>
              {s.truncated && <span>Esta hoja se corta en 10.000 filas.</span>}
            </p>
          </Tabs.Content>
        ))}
        <Tabs.Content value={INFO_TAB} className="focus:outline-none">
          {data.info.length === 0 ? (
            <p className={cn(STATE_TEXT_CLASS, 'py-10')}>Sin información del reporte.</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <tbody>
                {data.info.map(([label, value], i) => (
                  <tr key={`${label}-${i}`} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                    <th scope="row" className={cn(TH_CLASS, 'w-40 px-3 py-1.5 align-top')}>
                      {label}
                    </th>
                    <td className={cn(TD_COMPACT_CLASS, 'py-1.5')}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
