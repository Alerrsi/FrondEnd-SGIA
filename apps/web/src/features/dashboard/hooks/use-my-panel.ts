import { useMemo } from 'react';
import {
  useChartTemplates,
  useCreateMyChart,
  useDeleteMyChart,
  useMyCharts,
  useUpdateMyChart,
  useUpdateMyChartPositions,
} from '@sgia/api-client';
import type { ChartTemplate, MetricQueryInput, UserChart } from '@sgia/types';
import { MAX_USER_CHARTS } from '@sgia/types';

import { buildPositionUpdates, moveItem } from '../lib/panel-positions';
import type { ChartType } from '../types/metrics';

export interface PanelChart {
  id: number;
  input: MetricQueryInput;
  /** `kpi` se dibuja como cifra; el resto como gráfico. */
  visualization: string;
  chart: UserChart;
}

/** Plantilla genérica (consulta nula) que corresponde a cada forma gráfica del catálogo. */
const GENERIC_CODE: Record<ChartType, string> = {
  BAR: 'bar',
  LINE: 'line',
  DOUGHNUT: 'pie',
  POLAR_AREA: 'pie',
};

export function pickGenericTemplate(
  templates: ChartTemplate[],
  chartType: ChartType,
): ChartTemplate | undefined {
  return (
    templates.find((t) => t.code === GENERIC_CODE[chartType]) ??
    templates.find((t) => t.entity === null)
  );
}

/** Estado del panel personal (REQ-15): gráficos propios en el servidor, hasta 5 por usuario. */
export function useMyPanel() {
  const charts = useMyCharts();
  const templatesQuery = useChartTemplates();
  const create = useCreateMyChart();
  const update = useUpdateMyChart();
  const positions = useUpdateMyChartPositions();
  const remove = useDeleteMyChart();

  const all = charts.data;
  const visible = useMemo<PanelChart[]>(
    () =>
      (all ?? [])
        .filter((c) => c.is_active && c.metric_input)
        .map((c) => ({
          id: c.id,
          input: c.metric_input as MetricQueryInput,
          visualization: c.template?.visualization_type ?? 'bar',
          chart: c,
        })),
    [all],
  );
  const hidden = useMemo(() => (all ?? []).filter((c) => !c.is_active), [all]);
  const templates = templatesQuery.data ?? [];
  /** Los ocultos también ocupan posición: el límite de 5 cuenta todos. */
  const total = all?.length ?? 0;

  const reorder = async (sourceIndex: number, targetIndex: number) => {
    const next = moveItem(visible, sourceIndex, targetIndex);
    const updates = buildPositionUpdates(
      visible.map((v) => v.chart),
      next.map((v) => v.chart),
    );
    if (updates.length > 0) await positions.mutateAsync(updates);
  };

  /** Crea desde una plantilla; los datos elegidos en el asistente sobreescriben los de la plantilla. */
  const addChart = async (
    template: ChartTemplate,
    input?: MetricQueryInput,
    targetIndex?: number,
  ) => {
    const created = await create.mutateAsync({
      chart_template_id: template.id,
      ...(input
        ? {
            custom_title: input.title ?? null,
            type: input.chartType,
            entity: input.entity,
            metric: input.metric,
            group_by: input.groupBy ?? null,
            period: input.timeRange,
            ...(input.timeRange === 'CUSTOM'
              ? { date_from: input.dateFrom ?? null, date_to: input.dateTo ?? null }
              : {}),
          }
        : {}),
    });
    if (targetIndex !== undefined && targetIndex < visible.length) {
      const order = [...visible.map((v) => v.chart)];
      order.splice(targetIndex, 0, created);
      const updates = buildPositionUpdates(
        visible.map((v) => v.chart),
        order,
      );
      if (updates.length > 0) await positions.mutateAsync(updates);
    }
    return created;
  };

  return {
    isLoading: charts.isLoading || templatesQuery.isLoading,
    error: charts.error,
    visible,
    hidden,
    total,
    templates,
    canAdd: total < MAX_USER_CHARTS,
    isMutating:
      create.isPending || update.isPending || positions.isPending || remove.isPending,
    reorder,
    addChart,
    hide: (id: number) => update.mutateAsync({ id, payload: { is_active: false } }),
    show: (id: number) => update.mutateAsync({ id, payload: { is_active: true } }),
    remove: (id: number) => remove.mutateAsync(id),
  };
}
