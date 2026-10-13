import { useState, useEffect } from 'react';
import {
  BarChart3,
  Plus,
  RotateCcw,
  LayoutGrid,
  Pencil,
  Check,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MetricStrip } from '../components/metric-strip';
import { DynamicChartCard } from '../components/dynamic-chart-card';
import { ChartBuilderModal } from '../components/chart-builder-modal';
import { WidgetPaletteDrawer } from '../components/widget-palette-drawer';
import { PostDropConfigModal } from '../components/post-drop-config-modal';
import { DropZone } from '../components/drop-zone';
import { useExecutiveKpis } from '../hooks/use-metrics';
import type {
  ChartType,
  DashboardTemplate,
  DragItemPayload,
  MetricQueryInput,
} from '../types/metrics';
import { toast } from '@/lib/toast';

// 3 Plantillas predeterminadas del sistema
const DEFAULT_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'template-operaciones',
    name: 'Operaciones y Movimiento de Pañol',
    description: 'Flujo de préstamos, tasas de devolución y alertas críticas de stock.',
    charts: [
      {
        title: 'Préstamos Diarios por Semana',
        entity: 'LOANS',
        metric: 'COUNT',
        timeRange: 'LAST_30_DAYS',
        chartType: 'LINE',
      },
      {
        title: 'Estado y Atrasos de Préstamos',
        entity: 'LOANS',
        metric: 'RATE',
        timeRange: 'LAST_30_DAYS',
        chartType: 'DOUGHNUT',
      },
      {
        title: 'Alertas Críticas por Especialidad',
        entity: 'ALERTS',
        metric: 'COUNT',
        timeRange: 'LAST_30_DAYS',
        chartType: 'BAR',
      },
    ],
  },
  {
    id: 'template-demanda',
    name: 'Demanda y Desgaste por Carrera',
    description: 'Consumo de insumos por área y ranking de equipamiento solicitado.',
    charts: [
      {
        title: 'Insumos Consumidos por Especialidad',
        entity: 'SUPPLIES',
        metric: 'TOTAL',
        timeRange: 'SEMESTER_CURRENT',
        chartType: 'BAR',
      },
      {
        title: 'Ranking de Equipos Más Solicitados',
        entity: 'EQUIPMENT',
        metric: 'COUNT',
        timeRange: 'SEMESTER_CURRENT',
        chartType: 'BAR',
      },
      {
        title: 'Préstamos por Asignatura Clave',
        entity: 'TEACHERS',
        metric: 'COUNT',
        timeRange: 'SEMESTER_CURRENT',
        chartType: 'POLAR_AREA',
      },
    ],
  },
  {
    id: 'template-salud',
    name: 'Salud del Inventario y Ciclo de Vida',
    description: 'Equipos ociosos, incidencias en taller y rotación semestral.',
    charts: [
      {
        title: 'Equipos Ociosos / Sin Rotación',
        entity: 'EQUIPMENT',
        metric: 'COUNT',
        timeRange: 'YEAR_TO_DATE',
        chartType: 'BAR',
      },
      {
        title: 'Incidencias y Reparaciones en Taller',
        entity: 'MAINTENANCE',
        metric: 'COUNT',
        timeRange: 'LAST_30_DAYS',
        chartType: 'LINE',
      },
      {
        title: 'Tasa de Rotación Semestral de Insumos (%)',
        entity: 'SUPPLIES',
        metric: 'RATE',
        timeRange: 'SEMESTER_CURRENT',
        chartType: 'BAR',
      },
    ],
  },
];

const STORAGE_KEY = 'sgia_dashboard_charts_v1';

export default function DashboardPage() {
  const { data: kpis, isLoading: isLoadingKpis } = useExecutiveKpis('LAST_30_DAYS');

  // Estado de gráficos activos
  const [activeTemplateId, setActiveTemplateId] = useState<string>('template-operaciones');
  const [charts, setCharts] = useState<MetricQueryInput[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignorar errores de parsing
    }
    return DEFAULT_TEMPLATES[0]!.charts;
  });

  // Modo Edición / Visualización
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Paleta lateral de widgets genéricos
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  // Asistente modal tras soltar widget (Post-Drop)
  const [pendingDrop, setPendingDrop] = useState<{
    chartType: ChartType;
    targetIndex: number;
  } | null>(null);

  // Modal para agregar gráfico manual clásico
  const [builderOpen, setBuilderOpen] = useState(false);

  // Modal de confirmación para eliminar gráfico
  const [chartToDeleteIndex, setChartToDeleteIndex] = useState<number | null>(null);

  // Guardar en localStorage al cambiar gráficos
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
    } catch {
      // Storage no disponible
    }
  }, [charts]);

  const handleSelectTemplate = (template: DashboardTemplate) => {
    setActiveTemplateId(template.id);
    setCharts(template.charts);
    toast.info(`Plantilla cambiada a: ${template.name}`);
  };

  const handleAddChart = (newChart: MetricQueryInput) => {
    setCharts((prev) => [...prev, newChart]);
    setActiveTemplateId('custom');
  };

  const handleConfirmDelete = () => {
    if (chartToDeleteIndex !== null) {
      setCharts((prev) => prev.filter((_, idx) => idx !== chartToDeleteIndex));
      setChartToDeleteIndex(null);
      toast.success('Gráfico retirado del panel');
    }
  };

  const handleResetToDefault = () => {
    const defaultTemplate = DEFAULT_TEMPLATES[0]!;
    setActiveTemplateId(defaultTemplate.id);
    setCharts(defaultTemplate.charts);
    toast.success('Dashboard restablecido a la plantilla por defecto');
  };

  // Toggle de Modo Edición con persistencia explícita en "Guardar y Salir"
  const handleToggleEditMode = () => {
    if (isEditMode) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
      } catch {
        // Storage no disponible
      }
      setIsEditMode(false);
      setPaletteOpen(false);
      toast.success('Distribución del dashboard guardada exitosamente');
    } else {
      setIsEditMode(true);
      toast.info('Modo de Edición activado: arrastra widgets o reordena los gráficos');
    }
  };

  // Manejo de Drop en una DropZone
  const handleDropPayload = (targetIndex: number, payload: DragItemPayload) => {
    if (payload.type === 'NEW_WIDGET') {
      if (charts.length >= 5) {
        toast.error('Límite alcanzado: Máximo 5 gráficos simultáneos permitidos por plantilla');
        return;
      }
      setPendingDrop({ chartType: payload.chartType, targetIndex });
    } else if (payload.type === 'REORDER') {
      const sourceIndex = payload.sourceIndex;
      if (sourceIndex === targetIndex || sourceIndex === targetIndex - 1) {
        return;
      }
      const updated = [...charts];
      const [moved] = updated.splice(sourceIndex, 1);
      if (moved) {
        const insertIndex = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
        updated.splice(insertIndex, 0, moved);
        setCharts(updated);
        setActiveTemplateId('custom');
        toast.info('Posición del gráfico actualizada en el panel');
      }
    }
  };

  const handleConfirmPostDrop = (newChart: MetricQueryInput, targetIndex: number) => {
    const updated = [...charts];
    updated.splice(targetIndex, 0, newChart);
    setCharts(updated);
    setActiveTemplateId('custom');
    setPendingDrop(null);
  };

  const handleCancelPostDrop = () => {
    setPendingDrop(null);
    toast.info('Acción de soltado cancelada; el lienzo no fue alterado');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado Superior */}
      <div className="flex flex-col gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-zinc-400 text-xs font-mono">/</span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Analítica y Métricas Dinámicas
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Dashboards Analíticos y Métricas
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Visualización interactiva zed.dev del pañol y constructor de gráficos por consulta flexible.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Paleta de Formas (disponible en modo edición o acceso directo) */}
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaletteOpen(true)}
                className="text-xs gap-1.5 border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Paleta de Formas</span>
              </Button>
            )}

            {/* Toggle Modo Edición / Guardar y Salir */}
            <Button
              type="button"
              variant={isEditMode ? 'primary' : 'outline'}
              size="sm"
              onClick={handleToggleEditMode}
              className={`text-xs gap-1.5 ${
                isEditMode
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700'
                  : ''
              }`}
            >
              {isEditMode ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Guardar y Salir</span>
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Modo Edición</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restablecer</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setBuilderOpen(true)}
              disabled={charts.length >= 5}
              className="text-xs gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nuevo Gráfico ({charts.length}/5)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Banner Informativo en Modo Edición */}
      {isEditMode && (
        <div
          data-testid="edit-mode-banner"
          className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-xs font-mono text-red-700 dark:text-red-400"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>
              <strong>Modo Edición Activo:</strong> Arrastra formas desde la paleta hacia las zonas
              de soltado o reordena los gráficos existentes. Límite máximo: 5 gráficos.
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="text-xs h-7 gap-1 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300"
          >
            <Palette className="h-3 w-3" />
            <span>Abrir Catálogo de Widgets</span>
          </Button>
        </div>
      )}

      {/* Cinta Métrica Compacta Superior (Executive KPIs) */}
      <MetricStrip kpis={kpis} isLoading={isLoadingKpis} />

      {/* Selector de Plantillas Predeterminadas */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <LayoutGrid className="h-4 w-4" />
          <span>Plantillas de Análisis:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DEFAULT_TEMPLATES.map((tmpl) => {
            const isActive = activeTemplateId === tmpl.id;
            return (
              <Button
                key={tmpl.id}
                type="button"
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSelectTemplate(tmpl)}
                className={`text-xs ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {tmpl.name}
              </Button>
            );
          })}

          {activeTemplateId === 'custom' && (
            <span className="rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 px-2 py-1 text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
              Plantilla Personalizada
            </span>
          )}
        </div>
      </div>

      {/* Grid de Gráficos y Zonas de Soltado (Drag & Drop Canvas) */}
      {charts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center font-mono text-xs text-zinc-400 gap-3">
          <BarChart3 className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p>No hay gráficos activos en el panel actual.</p>
          {isEditMode ? (
            <div className="w-full max-w-md">
              <DropZone
                index={0}
                disabled={false}
                onDropPayload={handleDropPayload}
              />
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBuilderOpen(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Crear primer gráfico</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {isEditMode ? (
            <div className="flex flex-col gap-4">
              {/* DropZone al inicio (Posición 0) */}
              <DropZone
                index={0}
                disabled={charts.length >= 5}
                onDropPayload={handleDropPayload}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {charts.map((chart, idx) => (
                  <div key={`${chart.entity}_${chart.metric}_${chart.chartType}_${idx}`} className="flex flex-col gap-3">
                    <DynamicChartCard
                      index={idx}
                      isEditMode={true}
                      input={chart}
                      onDelete={() => setChartToDeleteIndex(idx)}
                    />

                    {/* DropZone intermedia tras cada tarjeta */}
                    <DropZone
                      index={idx + 1}
                      disabled={charts.length >= 5}
                      onDropPayload={handleDropPayload}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {charts.map((chart, idx) => (
                <DynamicChartCard
                  key={`${chart.entity}_${chart.metric}_${chart.timeRange}_${chart.chartType}_${idx}`}
                  index={idx}
                  isEditMode={false}
                  input={chart}
                  onDelete={() => setChartToDeleteIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel Lateral Retráctil de Widgets Genéricos (Widget Palette Drawer) */}
      <WidgetPaletteDrawer
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        currentChartsCount={charts.length}
      />

      {/* Asistente Contextual Post-Drop (al soltar una forma en una DropZone) */}
      {pendingDrop && (
        <PostDropConfigModal
          open={true}
          onClose={handleCancelPostDrop}
          onConfirm={handleConfirmPostDrop}
          chartType={pendingDrop.chartType}
          targetIndex={pendingDrop.targetIndex}
          currentCharts={charts}
        />
      )}

      {/* Constructor Clásico de Gráficos (Modal Dialog) */}
      <ChartBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onAddChart={handleAddChart}
        currentCharts={charts}
      />

      {/* Diálogo de Confirmación para eliminar gráfico */}
      <ConfirmDialog
        open={chartToDeleteIndex !== null}
        onCancel={() => setChartToDeleteIndex(null)}
        onConfirm={handleConfirmDelete}
        title="¿Retirar gráfico del panel?"
        description="Esta visualización será eliminada de tu plantilla activa. Puedes volver a generarla cuando desees."
        confirmLabel="Retirar Gráfico"
        cancelLabel="Conservar"
        variant="danger"
      />
    </div>
  );
}
