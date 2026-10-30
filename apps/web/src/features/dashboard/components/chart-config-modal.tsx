import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { CHART_PRESETS } from '../lib/chart-presets';
import { isSameChart } from '../lib/chart-config';
import {
  AGGREGATIONS_BY_ENTITY,
  AGGREGATION_LABELS,
  CHART_TYPE_LABELS,
  ENTITY_LABELS,
  GROUP_BY_OPTIONS_BY_ENTITY,
  MAX_CHARTS,
  PIE_LIKE_DEFAULT_LIMIT,
  TIME_RANGES,
  TIME_RANGE_LABELS,
  generateDefaultChartTitle,
  isPieLike,
  isTimeSeries,
  type ChartType,
  type MetricAggregation,
  type MetricEntity,
  type MetricQueryInput,
  type TimeRange,
} from '../types/metrics';

interface ChartConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (chart: MetricQueryInput, targetIndex?: number) => void;
  /** Tipo de gráfico elegido en el catálogo o soltado en el lienzo. */
  chartType: ChartType;
  /** Posición de inserción; si se omite, se agrega al final. */
  targetIndex?: number;
  currentCharts: MetricQueryInput[];
}

const FIELD_CLASS =
  'h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400';
const LABEL_CLASS = 'font-semibold text-zinc-700 dark:text-zinc-300';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ChartConfigModal({
  open,
  onClose,
  onConfirm,
  chartType: initialChartType,
  targetIndex,
  currentCharts,
}: ChartConfigModalProps) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [entity, setEntity] = useState<MetricEntity>('LOANS');
  const [metric, setMetric] = useState<MetricAggregation>('COUNT');
  const [groupBy, setGroupBy] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('LAST_30_DAYS');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit, setLimit] = useState('');
  const [customTitle, setCustomTitle] = useState<string | null>(null);

  const groupOptions = GROUP_BY_OPTIONS_BY_ENTITY[entity];
  const metricOptions = AGGREGATIONS_BY_ENTITY[entity];
  const isCustomRange = timeRange === 'CUSTOM';
  const timeSeries = isTimeSeries(entity, groupBy, metric);
  const title = customTitle ?? generateDefaultChartTitle(entity, metric, groupBy);
  const missingDateFrom = isCustomRange && !dateFrom;
  const invalidRange = isCustomRange && !!dateFrom && !!dateTo && dateTo < dateFrom;
  const parsedLimit = limit === '' ? undefined : Number(limit);
  const invalidLimit =
    parsedLimit !== undefined &&
    (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50);

  const handleEntityChange = (next: MetricEntity) => {
    setEntity(next);
    setGroupBy('');
    if (!AGGREGATIONS_BY_ENTITY[next].includes(metric)) setMetric('COUNT');
  };

  const applyPreset = (preset: MetricQueryInput) => {
    setChartType(preset.chartType);
    setEntity(preset.entity);
    setMetric(preset.metric);
    setGroupBy(preset.groupBy ?? '');
    setTimeRange(preset.timeRange);
    setDateFrom('');
    setDateTo('');
    setLimit(preset.limit !== undefined ? String(preset.limit) : '');
    setCustomTitle(preset.title ?? null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentCharts.length >= MAX_CHARTS) {
      toast.error(`Límite alcanzado: máximo ${MAX_CHARTS} gráficos simultáneos por plantilla`);
      return;
    }
    if (missingDateFrom || invalidRange || invalidLimit) return;

    const effectiveLimit =
      parsedLimit ?? (isPieLike(chartType) && !timeSeries ? PIE_LIKE_DEFAULT_LIMIT : undefined);

    const chart: MetricQueryInput = {
      title: title.trim() || generateDefaultChartTitle(entity, metric, groupBy),
      entity,
      metric,
      chartType,
      timeRange,
      ...(groupBy ? { groupBy } : {}),
      ...(isCustomRange ? { dateFrom, ...(dateTo ? { dateTo } : {}) } : {}),
      ...(effectiveLimit !== undefined ? { limit: effectiveLimit } : {}),
    };

    if (currentCharts.some((c) => isSameChart(c, chart))) {
      toast.error('Ya existe un gráfico con la misma consulta y tipo de visualización');
      return;
    }

    onConfirm(chart, targetIndex);
    onClose();
  };

  const presets = CHART_PRESETS[chartType];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Configurar gráfico"
      description="Elige qué datos quieres ver y cómo mostrarlos antes de añadirlo al panel."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 text-xs">
        <fieldset className="flex flex-col gap-1.5">
          <legend className={cn(LABEL_CLASS, 'mb-1')}>Tipo de gráfico</legend>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CHART_TYPE_LABELS) as ChartType[]).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={chartType === type}
                onClick={() => setChartType(type)}
                className={cn(
                  'h-7 rounded-md border px-2.5 text-xs transition-colors',
                  chartType === type
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900',
                )}
              >
                {CHART_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Sugerencias para {CHART_TYPE_LABELS[chartType].toLowerCase()}</span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 px-2 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="chart-entity" className={LABEL_CLASS}>
              ¿Qué quieres medir?
            </label>
            <select
              id="chart-entity"
              value={entity}
              onChange={(e) => handleEntityChange(e.target.value as MetricEntity)}
              className={FIELD_CLASS}
            >
              {(Object.keys(ENTITY_LABELS) as MetricEntity[]).map((key) => (
                <option key={key} value={key}>
                  {ENTITY_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="chart-metric" className={LABEL_CLASS}>
              Cálculo
            </label>
            <select
              id="chart-metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricAggregation)}
              className={FIELD_CLASS}
            >
              {metricOptions.map((key) => (
                <option key={key} value={key}>
                  {AGGREGATION_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="chart-group-by" className={LABEL_CLASS}>
              Agrupar por
            </label>
            <select
              id="chart-group-by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">
                {isTimeSeries(entity) ? 'Sin agrupar (serie en el tiempo)' : 'Sin agrupar (ranking)'}
              </option>
              {groupOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="chart-time-range" className={LABEL_CLASS}>
              Período
            </label>
            <select
              id="chart-time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className={FIELD_CLASS}
            >
              {TIME_RANGES.map((key) => (
                <option key={key} value={key}>
                  {TIME_RANGE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          {isCustomRange && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="chart-date-from" className={LABEL_CLASS}>
                  Desde *
                </label>
                <input
                  id="chart-date-from"
                  type="date"
                  value={dateFrom}
                  max={todayIso()}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="chart-date-to" className={LABEL_CLASS}>
                  Hasta (opcional)
                </label>
                <input
                  id="chart-date-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  max={todayIso()}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              {(missingDateFrom || invalidRange) && (
                <p role="alert" className="sm:col-span-2 text-[11px] text-amber-700 dark:text-amber-400">
                  {missingDateFrom
                    ? 'El rango personalizado requiere una fecha de inicio.'
                    : 'La fecha final no puede ser anterior a la inicial.'}
                </p>
              )}
            </>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="chart-limit" className={LABEL_CLASS}>
              Máximo de elementos
            </label>
            <input
              id="chart-limit"
              type="number"
              min={1}
              max={50}
              value={limit}
              disabled={timeSeries}
              placeholder={
                timeSeries
                  ? 'No aplica a series en el tiempo'
                  : isPieLike(chartType)
                    ? `${PIE_LIKE_DEFAULT_LIMIT} (recomendado)`
                    : '10 por defecto'
              }
              onChange={(e) => setLimit(e.target.value)}
              className={cn(FIELD_CLASS, 'disabled:opacity-50')}
            />
            {invalidLimit && (
              <span role="alert" className="text-[11px] text-amber-700 dark:text-amber-400">
                Ingresa un entero entre 1 y 50.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="chart-title" className={LABEL_CLASS}>
              Título del gráfico
            </label>
            <input
              id="chart-title"
              type="text"
              value={title}
              onChange={(e) => setCustomTitle(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </div>

        {isPieLike(chartType) && timeSeries && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Las series en el tiempo se leen mejor en barras o línea; agrupa los datos para usar {CHART_TYPE_LABELS[chartType].toLowerCase()}.
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400">
            Cupo tras añadir: {currentCharts.length + 1} de {MAX_CHARTS}
          </span>
          <div className="flex gap-2">
            <DialogCloseButton variant="outline" size="sm">
              Cancelar
            </DialogCloseButton>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={missingDateFrom || invalidRange || invalidLimit}
              className="gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir al panel</span>
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
