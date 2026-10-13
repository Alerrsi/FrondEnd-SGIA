import { useState, useEffect } from 'react';
import { Plus, Lock } from 'lucide-react';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import {
  type ChartType,
  type MetricAggregation,
  type MetricEntity,
  type MetricQueryInput,
  type TimeRange,
  CHART_TYPE_LABELS,
  GROUP_BY_OPTIONS_BY_ENTITY,
  generateDefaultChartTitle,
} from '../types/metrics';

interface PostDropConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (chart: MetricQueryInput, targetIndex: number) => void;
  chartType: ChartType;
  targetIndex: number;
  currentCharts: MetricQueryInput[];
}

export function PostDropConfigModal({
  open,
  onClose,
  onConfirm,
  chartType,
  targetIndex,
  currentCharts,
}: PostDropConfigModalProps) {
  const [entity, setEntity] = useState<MetricEntity>('EQUIPMENT');
  const [metric, setMetric] = useState<MetricAggregation>('COUNT');
  const [timeRange, setTimeRange] = useState<TimeRange>('LAST_30_DAYS');
  const [groupBy, setGroupBy] = useState<string>('hardware_category');
  const [title, setTitle] = useState('');
  const [hasManuallyEditedTitle, setHasManuallyEditedTitle] = useState(false);

  // Al cambiar la entidad, actualizar la opción de agrupación por defecto
  useEffect(() => {
    const validGroupOptions = GROUP_BY_OPTIONS_BY_ENTITY[entity] || [];
    if (validGroupOptions.length > 0) {
      const defaultGroup = validGroupOptions[0]?.value || '';
      setGroupBy(defaultGroup);
      if (!hasManuallyEditedTitle) {
        setTitle(generateDefaultChartTitle(entity, metric, defaultGroup));
      }
    }
  }, [entity, metric, hasManuallyEditedTitle]);

  // Actualizar el título sugerido si el usuario no lo ha personalizado a mano
  const handleGroupByChange = (newGroupBy: string) => {
    setGroupBy(newGroupBy);
    if (!hasManuallyEditedTitle) {
      setTitle(generateDefaultChartTitle(entity, metric, newGroupBy));
    }
  };

  const handleEntityChange = (newEntity: MetricEntity) => {
    setEntity(newEntity);
    const validGroupOptions = GROUP_BY_OPTIONS_BY_ENTITY[newEntity] || [];
    const defaultGroup = validGroupOptions[0]?.value || '';
    setGroupBy(defaultGroup);
    if (!hasManuallyEditedTitle) {
      setTitle(generateDefaultChartTitle(newEntity, metric, defaultGroup));
    }
  };

  const handleMetricChange = (newMetric: MetricAggregation) => {
    setMetric(newMetric);
    if (!hasManuallyEditedTitle) {
      setTitle(generateDefaultChartTitle(entity, newMetric, groupBy));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verificación de cupo máximo
    if (currentCharts.length >= 5) {
      toast.error('Límite alcanzado: Máximo 5 gráficos simultáneos permitidos por plantilla');
      onClose();
      return;
    }

    // 2. Validación anti-duplicados (entidad, cálculo, tipo y agrupación)
    const isDuplicate = currentCharts.some((c) => {
      const sameEntity = c.entity === entity;
      const sameMetric = c.metric === metric;
      const sameChartType = c.chartType === chartType;
      const sameGroupBy =
        c.groupBy === groupBy || (!c.groupBy && !groupBy);
      return sameEntity && sameMetric && sameChartType && sameGroupBy;
    });

    if (isDuplicate) {
      toast.error(
        'Ya existe un gráfico con idéntica entidad, cálculo, tipo y agrupación.',
      );
      return;
    }

    const finalTitle =
      title.trim() || generateDefaultChartTitle(entity, metric, groupBy);

    const newChart: MetricQueryInput = {
      title: finalTitle,
      entity,
      metric,
      chartType,
      timeRange,
      groupBy,
    };

    onConfirm(newChart, targetIndex);
    toast.success('Gráfico analítico configurado e insertado');
    onClose();
  };

  const groupOptions = GROUP_BY_OPTIONS_BY_ENTITY[entity] || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Asistente de Configuración Analítica (Post-Drop)"
      description="Personaliza los parámetros de la forma gráfica soltada para integrarla al panel."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 text-xs font-mono">
        {/* Banner de forma gráfica bloqueada */}
        <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-2.5">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Forma Gráfica Asignada:
            </span>
            <span className="font-bold text-red-600 dark:text-red-500">
              {CHART_TYPE_LABELS[chartType]}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Posición destino: #{targetIndex + 1}
          </span>
        </div>

        {/* Título Personalizado */}
        <div className="flex flex-col gap-1">
          <label htmlFor="post-drop-title" className="font-semibold text-zinc-700 dark:text-zinc-300">
            Título del Gráfico (Sugerido / Personalizable)
          </label>
          <input
            id="post-drop-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasManuallyEditedTitle(true);
            }}
            placeholder="Título del gráfico..."
            className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Entidad */}
          <div className="flex flex-col gap-1">
            <label htmlFor="post-drop-entity" className="font-semibold text-zinc-700 dark:text-zinc-300">
              Entidad de Pañol TI *
            </label>
            <select
              id="post-drop-entity"
              value={entity}
              onChange={(e) => handleEntityChange(e.target.value as MetricEntity)}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="EQUIPMENT">Equipos y Activos (EQUIPMENT)</option>
              <option value="SUPPLIES">Insumos y Fungibles (SUPPLIES)</option>
              <option value="LOANS">Préstamos de Pañol (LOANS)</option>
              <option value="ALERTS">Alertas de Stock (ALERTS)</option>
              <option value="MAINTENANCE">Mantención y Fallas (MAINTENANCE)</option>
              <option value="CAREERS">Carreras / Especialidades (CAREERS)</option>
              <option value="TEACHERS">Docentes / Asignaturas (TEACHERS)</option>
            </select>
          </div>

          {/* Métrica / Agregación */}
          <div className="flex flex-col gap-1">
            <label htmlFor="post-drop-metric" className="font-semibold text-zinc-700 dark:text-zinc-300">
              Cálculo / Agregación *
            </label>
            <select
              id="post-drop-metric"
              value={metric}
              onChange={(e) => handleMetricChange(e.target.value as MetricAggregation)}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="COUNT">Conteo / Frecuencia (COUNT)</option>
              <option value="TOTAL">Volumen Total (TOTAL)</option>
              <option value="AVERAGE">Promedio (AVERAGE)</option>
              <option value="RATE">Tasa Porcentual (RATE)</option>
            </select>
          </div>

          {/* Agrupar por (Dinámico y contextual a la entidad) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="post-drop-groupby" className="font-semibold text-zinc-700 dark:text-zinc-300">
              Agrupar por (Group By Contextual) *
            </label>
            <select
              id="post-drop-groupby"
              value={groupBy}
              onChange={(e) => handleGroupByChange(e.target.value)}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              {groupOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ventana Temporal */}
          <div className="flex flex-col gap-1">
            <label htmlFor="post-drop-timerange" className="font-semibold text-zinc-700 dark:text-zinc-300">
              Ventana Temporal *
            </label>
            <select
              id="post-drop-timerange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="LAST_7_DAYS">Últimos 7 Días</option>
              <option value="LAST_30_DAYS">Últimos 30 Días</option>
              <option value="SEMESTER_CURRENT">Semestre Actual</option>
              <option value="SEMESTER_PREVIOUS">Semestre Anterior</option>
              <option value="YEAR_TO_DATE">Año en Curso</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-2">
          <span className="text-[11px] text-zinc-400">
            Cupo tras inserción: {currentCharts.length + 1} de 5
          </span>

          <div className="flex gap-2">
            <DialogCloseButton variant="outline" size="sm" onClick={onClose}>
              Cancelar Soltado
            </DialogCloseButton>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Confirmar e Insertar</span>
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
