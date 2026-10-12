import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import type {
  ChartType,
  MetricAggregation,
  MetricEntity,
  MetricQueryInput,
  TimeRange,
} from '../types/metrics';

interface ChartBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onAddChart: (chart: MetricQueryInput) => void;
  currentCharts: MetricQueryInput[];
}

export function ChartBuilderModal({
  open,
  onClose,
  onAddChart,
  currentCharts,
}: ChartBuilderModalProps) {
  const [title, setTitle] = useState('');
  const [entity, setEntity] = useState<MetricEntity>('EQUIPMENT');
  const [metric, setMetric] = useState<MetricAggregation>('COUNT');
  const [chartType, setChartType] = useState<ChartType>('BAR');
  const [timeRange, setTimeRange] = useState<TimeRange>('LAST_30_DAYS');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Regla obligatoria: Máximo 5 gráficos simultáneos
    if (currentCharts.length >= 5) {
      toast.error('Límite alcanzado: Máximo 5 gráficos simultáneos permitidos por plantilla');
      return;
    }

    // 2. Regla obligatoria: Prevención de duplicados idénticos
    const isDuplicate = currentCharts.some(
      (c) =>
        c.entity === entity &&
        c.metric === metric &&
        c.chartType === chartType &&
        c.timeRange === timeRange,
    );

    if (isDuplicate) {
      toast.error(
        'Ya existe un gráfico con la misma entidad, cálculo, tipo y rango temporal',
      );
      return;
    }

    const newChart: MetricQueryInput = {
      title: title.trim() || `${entity} - ${metric}`,
      entity,
      metric,
      chartType,
      timeRange,
    };

    onAddChart(newChart);
    toast.success('Gráfico analítico añadido al panel');
    setTitle('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Constructor de Gráficos Analíticos (GraphQL Builder)"
      description="Compone una métrica a medida seleccionando la entidad, agregación matemática y tipo de visualización."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 text-xs font-mono">
        {/* Título opcional */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300">
            Título Personalizado del Gráfico
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Insumos con Mayor Rotación en Laboratorios"
            className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Entidad */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Entidad de Datos (Entity) *
            </label>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value as MetricEntity)}
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
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Cálculo / Agregación *
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricAggregation)}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="COUNT">Conteo / Frecuencia (COUNT)</option>
              <option value="TOTAL">Volumen Total (TOTAL)</option>
              <option value="AVERAGE">Promedio (AVERAGE)</option>
              <option value="RATE">Tasa Porcentual (RATE)</option>
            </select>
          </div>

          {/* Tipo de Gráfico */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Tipo de Visualización *
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="BAR">Barras Verticales (BAR)</option>
              <option value="LINE">Línea Temporal (LINE)</option>
              <option value="DOUGHNUT">Gráfico de Dona (DOUGHNUT)</option>
              <option value="POLAR_AREA">Área Polar (POLAR_AREA)</option>
            </select>
          </div>

          {/* Rango Temporal */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Ventana Temporal *
            </label>
            <select
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
            Cupo disponible: {5 - currentCharts.length} de 5
          </span>

          <div className="flex gap-2">
            <DialogCloseButton variant="outline" size="sm">
              Cancelar
            </DialogCloseButton>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={currentCharts.length >= 5}
              className="gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir Gráfico</span>
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
