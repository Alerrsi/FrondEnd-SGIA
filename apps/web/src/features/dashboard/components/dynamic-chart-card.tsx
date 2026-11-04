import { useState } from 'react';
import { ApiRequestError, useApiClientCustomMetric } from '@sgia/api-client';
import {
  Trash2,
  GripVertical,
  ArrowLeftRight,
  AlertTriangle,
  BarChart3,
  EyeOff,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import { apiErrorToMessage } from '@/lib/api-error';
import { buildLegend } from '../lib/chart-format';
import {
  CHART_TYPE_LABELS,
  TIME_RANGE_LABELS,
  type DragItemPayload,
  type MetricQueryInput,
} from '../types/metrics';
import { MetricChart } from './metric-chart';

interface DynamicChartCardProps {
  input: MetricQueryInput;
  index?: number;
  isEditMode?: boolean;
  onDelete?: () => void;
  /** Oculta el gráfico sin borrarlo (`is_active: false`); sigue ocupando su posición. */
  onHide?: () => void;
  /** `kpi` muestra una cifra en vez de un gráfico. */
  visualization?: string;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDropPayload?: (targetIndex: number, payload: DragItemPayload) => void;
}

/** Una cifra a partir de los puntos: el único valor, o la suma (o el primero si es un porcentaje). */
function formatKpiValue(points: Array<{ value: number }>, metric: MetricQueryInput['metric']): string {
  const value =
    points.length === 1 || metric === 'RATE' || metric === 'AVERAGE'
      ? (points[0]?.value ?? 0)
      : points.reduce((sum, p) => sum + p.value, 0);
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return metric === 'RATE' ? `${text}%` : text;
}

function describeRange(input: MetricQueryInput): string {
  if (input.timeRange !== 'CUSTOM') return TIME_RANGE_LABELS[input.timeRange];
  return `${input.dateFrom ?? '?'} → ${input.dateTo ?? 'hoy'}`;
}

export function DynamicChartCard({
  input,
  index = 0,
  isEditMode = false,
  onDelete,
  onHide,
  visualization,
  onDragStart,
  onDragEnd,
  onDropPayload,
}: DynamicChartCardProps) {
  const { data, isLoading, error } = useApiClientCustomMetric(input);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isDragOverCard, setIsDragOverCard] = useState(false);

  const title = input.title || `${input.entity} (${input.metric})`;
  const isForbidden = error instanceof ApiRequestError && error.status === 403;
  const legend = data ? buildLegend(data) : [];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'REORDER', sourceIndex: index }),
    );
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e, index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverCard) setIsDragOverCard(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverCard(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.preventDefault();
    setIsDragOverCard(false);

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const parsed = JSON.parse(dataStr) as DragItemPayload;
      onDropPayload?.(index, parsed);
    } catch {
      // Ignorar errores de parsing
    }
  };

  return (
    <Card
      draggable={isEditMode}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`chart-card-${index}`}
      className={`flex flex-col p-4 shadow-xs transition-all relative ${
        isEditMode
          ? isDragOverCard
            ? 'cursor-grabbing border-2 border-sky-500 ring-2 ring-sky-500/30 bg-sky-50/30 dark:bg-sky-950/30 scale-[1.01]'
            : 'cursor-grab active:cursor-grabbing border-dashed border-zinc-400 dark:border-zinc-700 hover:border-sky-500/70'
          : ''
      }`}
    >
      {/* Overlay feedback cuando se arrastra un gráfico encima para intercambiar lugar */}
      {isEditMode && isDragOverCard && (
        <div className="absolute inset-0 bg-sky-500/10 dark:bg-sky-500/20 rounded-lg flex items-center justify-center z-10 pointer-events-none backdrop-blur-2xs">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-sky-400 dark:border-sky-600 px-3 py-1.5 rounded-md shadow-md text-sky-700 dark:text-sky-400 font-mono text-xs font-semibold">
            <ArrowLeftRight className="h-4 w-4 animate-pulse" />
            <span>Soltar para mover a posición #{index + 1}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <div
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing"
              title="Arrastrar para mover o cambiar de lugar"
              aria-label="Arrastrar para mover o cambiar de lugar"
              data-testid={`drag-handle-${index}`}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {title}
              </span>
              {isEditMode && (
                <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1 py-0.2 rounded border border-zinc-200 dark:border-zinc-700">
                  #{index + 1}
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] text-zinc-400">
              {describeRange(input)} · {CHART_TYPE_LABELS[input.chartType]}
            </span>
          </div>
        </div>

        {onHide && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onHide}
            className="h-6 w-6 text-zinc-400 hover:text-zinc-700"
            title="Ocultar gráfico"
            aria-label="Ocultar gráfico"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-6 w-6 text-zinc-400 hover:text-rose-600"
            title="Eliminar gráfico"
            aria-label="Eliminar gráfico"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="relative h-64 w-full">
        {isLoading ? (
          <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-400">
            Cargando datos…
          </div>
        ) : isForbidden ? (
          <div
            role="alert"
            className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center font-mono text-xs text-zinc-500"
          >
            <Lock className="h-5 w-5" />
            <span>Tu rol no tiene permisos para ver las métricas.</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center font-mono text-xs text-rose-600 dark:text-rose-400"
          >
            <AlertTriangle className="h-5 w-5" />
            <span>{apiErrorToMessage(error)}</span>
          </div>
        ) : !data || data.points.length === 0 ? (
          <div
            data-testid={`chart-empty-${index}`}
            className="flex h-full flex-col items-center justify-center gap-2 font-mono text-xs text-zinc-400"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Sin datos para el período</span>
          </div>
        ) : visualization === 'kpi' ? (
          <div
            data-testid={`chart-kpi-${index}`}
            className="flex h-full flex-col items-center justify-center gap-1"
          >
            <span className="font-mono text-4xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatKpiValue(data.points, input.metric)}
            </span>
            <span className="font-mono text-[11px] text-zinc-500">{title}</span>
          </div>
        ) : (
          <MetricChart result={data} chartType={input.chartType} title={title} isDark={isDark} />
        )}
      </div>

      {legend.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {data?.summary && (
        <p
          title={data.summary}
          className="mt-2 truncate border-t border-zinc-100 dark:border-zinc-800 pt-2 font-mono text-[10px] text-zinc-400"
        >
          {data.summary}
        </p>
      )}
    </Card>
  );
}
