import { useMemo, useRef } from 'react';
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

import { isSameChart, templateToInput } from '../lib/chart-config';
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

/**
 * Plantilla a la que queda asociado un gráfico: la del servidor cuya consulta coincide con la
 * elegida o, si el usuario armó una consulta propia, la genérica de su forma.
 */
export function pickTemplateFor(
  templates: ChartTemplate[],
  input: MetricQueryInput,
): ChartTemplate | undefined {
  return (
    templates.find((t) => {
      const query = templateToInput(t);
      return query !== null && isSameChart(query, input);
    }) ?? pickGenericTemplate(templates, input.chartType)
  );
}

/** Error de regla del panel detectado antes de llamar al servidor (se muestra tal cual). */
export class PanelRuleError extends Error {}

/** Ya hay un alta en curso (doble clic): la segunda se descarta sin avisar. */
export class PanelBusyError extends PanelRuleError {}

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
  /** Consultas de todos los gráficos del usuario (los ocultos también cuentan como existentes). */
  const inputs = useMemo<MetricQueryInput[]>(
    () => (all ?? []).flatMap((c) => (c.metric_input ? [c.metric_input] : [])),
    [all],
  );
  /** Evita dos altas a la vez (doble clic) antes de que React deshabilite los botones. */
  const adding = useRef(false);

  const findDuplicate = (input: MetricQueryInput): UserChart | undefined =>
    (all ?? []).find((c) => c.metric_input && isSameChart(c.metric_input, input));
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

  /**
   * Crea un gráfico asociado a una plantilla (y al usuario autenticado, en el servidor); los datos
   * elegidos en el asistente sobreescriben los de la plantilla. Rechaza un gráfico repetido.
   */
  const addChart = async (
    template: ChartTemplate,
    input?: MetricQueryInput,
    targetIndex?: number,
  ) => {
    if (adding.current) throw new PanelBusyError('Ya se está añadiendo un gráfico.');
    const query = input ?? templateToInput(template);
    const twin = query ? findDuplicate(query) : undefined;
    if (twin) {
      throw new PanelRuleError(
        twin.is_active
          ? 'Ese gráfico ya está en tu panel.'
          : 'Ese gráfico ya está en tu panel, pero oculto: vuelve a mostrarlo desde "Ocultos".',
      );
    }

    adding.current = true;
    try {
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
    } finally {
      adding.current = false;
    }
  };

  return {
    isLoading: charts.isLoading || templatesQuery.isLoading,
    error: charts.error,
    visible,
    hidden,
    inputs,
    total,
    templates,
    /** `true` si la consulta de la plantilla ya está en el panel (visible u oculta). */
    hasTemplate: (template: ChartTemplate) => {
      const query = templateToInput(template);
      return query !== null && findDuplicate(query) !== undefined;
    },
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
