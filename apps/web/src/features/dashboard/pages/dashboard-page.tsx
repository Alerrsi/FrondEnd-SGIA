import { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  RotateCcw,
  LayoutGrid,
  Pencil,
  Check,
  Palette,
  SlidersHorizontal,
  Target,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useApiClientExecutiveKpis } from '@sgia/api-client';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MetricStrip } from '../components/metric-strip';
import { DynamicChartCard } from '../components/dynamic-chart-card';
import { WidgetPaletteDrawer } from '../components/widget-palette-drawer';
import { ChartConfigModal } from '../components/chart-config-modal';
import { DropZone } from '../components/drop-zone';
import { DragGhostPreview } from '../components/drag-ghost-preview';
import { DEFAULT_TEMPLATES } from '../lib/chart-presets';
import { sanitizeCharts } from '../lib/chart-config';
import {
  MAX_CHARTS,
  type ChartType,
  type DashboardTemplate,
  type DragItemPayload,
  type MetricQueryInput,
} from '../types/metrics';
import { toast } from '@/lib/toast';

const STORAGE_KEY = 'sgia_dashboard_charts_v1';
const TEMPLATES_STORAGE_KEY = 'sgia_dashboard_templates_v2';
const ACTIVE_TEMPLATE_ID_KEY = 'sgia_dashboard_active_template_id_v2';

export default function DashboardPage() {
  const {
    data: kpis,
    isLoading: isLoadingKpis,
    error: kpisError,
  } = useApiClientExecutiveKpis('LAST_30_DAYS');

  // Estado unificado de todas las plantillas (por defecto + personalizadas)
  const [templates, setTemplates] = useState<DashboardTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return (parsed as DashboardTemplate[]).map((t) => ({
            ...t,
            charts: sanitizeCharts(t.charts),
          }));
        }
      }
      // Migración retrospectiva: si existían gráficos guardados en sgia_dashboard_charts_v1
      const savedV1 = localStorage.getItem(STORAGE_KEY);
      if (savedV1) {
        const parsedV1 = JSON.parse(savedV1);
        if (Array.isArray(parsedV1) && parsedV1.length > 0) {
          return DEFAULT_TEMPLATES.map((t, idx) =>
            idx === 0 ? { ...t, charts: sanitizeCharts(parsedV1) } : t,
          );
        }
      }
    } catch {
      // Ignorar errores de parsing
    }
    return DEFAULT_TEMPLATES;
  });

  // ID de la plantilla seleccionada actualmente
  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_TEMPLATE_ID_KEY);
      if (savedId) return savedId;
    } catch {
      // Ignorar errores de parsing
    }
    return 'template-operaciones';
  });

  // Obtener la plantilla activa y sus gráficos garantizando integridad
  const activeTemplate =
    templates.find((t) => t.id === activeTemplateId) ||
    templates[0] ||
    DEFAULT_TEMPLATES[0]!;

  const charts = activeTemplate.charts;

  // Modo Edición / Visualización
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Paleta lateral de widgets genéricos
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  // Estado de arrastre activo desde la paleta de widgets
  const [isDraggingWidget, setIsDraggingWidget] = useState<boolean>(false);
  const [draggedWidgetType, setDraggedWidgetType] = useState<ChartType | null>(null);
  const draggedWidgetTypeRef = useRef<ChartType | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProminentOver, setIsProminentOver] = useState<boolean>(false);

  // Asistente modal tras soltar widget (Post-Drop en DropZone específica)
  const [pendingDrop, setPendingDrop] = useState<{
    chartType: ChartType;
    targetIndex?: number;
  } | null>(null);

  // Modal de confirmación para eliminar gráfico
  const [chartToDeleteIndex, setChartToDeleteIndex] = useState<number | null>(null);

  // Función unificada para guardar plantillas y sincronizar con localStorage
  const saveTemplatesState = (
    newTemplates: DashboardTemplate[],
    newActiveId: string,
  ) => {
    setTemplates(newTemplates);
    setActiveTemplateId(newActiveId);

    const current =
      newTemplates.find((t) => t.id === newActiveId) || newTemplates[0];
    const currentCharts = current?.charts || [];

    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
      localStorage.setItem(ACTIVE_TEMPLATE_ID_KEY, newActiveId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCharts));
    } catch {
      // Storage no disponible
    }
  };

  // Seguimiento global del cursor durante el arrastre y limpieza cuando finaliza
  useEffect(() => {
    const handleWindowDrag = (e: DragEvent) => {
      if (e.clientX !== 0 || e.clientY !== 0) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      if (e.clientX !== 0 || e.clientY !== 0) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleWindowDragEnd = () => {
      // Pequeño retardo para asegurar que el evento drop termine antes de limpiar
      setTimeout(() => {
        setIsDraggingWidget(false);
        setDraggedWidgetType(null);
        draggedWidgetTypeRef.current = null;
        setIsProminentOver(false);
      }, 80);
    };

    window.addEventListener('drag', handleWindowDrag);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragend', handleWindowDragEnd);

    return () => {
      window.removeEventListener('drag', handleWindowDrag);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragend', handleWindowDragEnd);
    };
  }, []);

  const handleSelectTemplate = (template: DashboardTemplate) => {
    saveTemplatesState(templates, template.id);
    toast.info(`Plantilla cambiada a: ${template.name}`);
  };

  const handleConfirmDelete = () => {
    if (chartToDeleteIndex !== null) {
      const updatedCharts = charts.filter((_, idx) => idx !== chartToDeleteIndex);
      const nextTemplates = templates.map((t) =>
        t.id === activeTemplateId ? { ...t, charts: updatedCharts } : t,
      );
      saveTemplatesState(nextTemplates, activeTemplateId);
      setChartToDeleteIndex(null);
      toast.success('Gráfico retirado del panel y plantilla guardada');
    }
  };

  const handleResetToDefault = () => {
    const defaultTmpl =
      DEFAULT_TEMPLATES.find((t) => t.id === activeTemplateId) || DEFAULT_TEMPLATES[0]!;
    const nextTemplates = templates.map((t) =>
      t.id === activeTemplateId ? { ...t, charts: defaultTmpl.charts } : t,
    );
    saveTemplatesState(nextTemplates, activeTemplateId);
    toast.success('Plantilla restablecida a sus valores por defecto');
  };

  // Toggle de Modo Edición con persistencia explícita en "Guardar y Salir"
  const handleToggleEditMode = () => {
    if (isEditMode) {
      saveTemplatesState(templates, activeTemplateId);
      setIsEditMode(false);
      setPaletteOpen(false);
      setIsDraggingWidget(false);
      setDraggedWidgetType(null);
      draggedWidgetTypeRef.current = null;
      setIsProminentOver(false);
      toast.success('Distribución del dashboard guardada exitosamente');
    } else {
      setIsEditMode(true);
      toast.info('Modo de Edición activado: añade o reordena los gráficos de tu plantilla');
    }
  };

  // Abrir catálogo de widgets (activa automáticamente modo edición si no está activo)
  const handleOpenWidgetCatalog = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      toast.info('Modo de Edición activado para añadir gráficos');
    }
    setPaletteOpen(true);
  };

  // Al iniciar el arrastre desde la paleta: enfocar zonas de inserción y registrar posición inicial
  const handleWidgetDragStart = (
    chartType: ChartType,
    clientPos?: { x: number; y: number },
  ) => {
    draggedWidgetTypeRef.current = chartType;
    setIsDraggingWidget(true);
    setDraggedWidgetType(chartType);
    if (clientPos && (clientPos.x !== 0 || clientPos.y !== 0)) {
      setMousePos(clientPos);
    } else if (typeof window !== 'undefined') {
      setMousePos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  };

  const handleWidgetDragEnd = () => {
    setTimeout(() => {
      setIsDraggingWidget(false);
      setDraggedWidgetType(null);
      draggedWidgetTypeRef.current = null;
      setIsProminentOver(false);
      setPaletteOpen(false);
    }, 80);
  };

  // Añadir un gráfico asegurando la actualización y persistencia en pantalla
  const addChartToActiveTemplate = (
    newChart: MetricQueryInput,
    targetIndex?: number,
  ) => {
    if (charts.length >= MAX_CHARTS) {
      toast.error('Límite alcanzado: Máximo 5 gráficos simultáneos permitidos por plantilla');
      return;
    }

    const updatedCharts = [...charts];
    if (
      typeof targetIndex === 'number' &&
      targetIndex >= 0 &&
      targetIndex <= updatedCharts.length
    ) {
      updatedCharts.splice(targetIndex, 0, newChart);
    } else {
      updatedCharts.push(newChart);
    }

    const currentTmpl = templates.find((t) => t.id === activeTemplateId);
    const baseName = currentTmpl ? currentTmpl.name : 'Personalizada';

    const customTemplateObj: DashboardTemplate = {
      id: 'template-custom',
      name: 'Plantilla Personalizada',
      description: `Plantilla personalizada basada en ${baseName} con gráficos añadidos.`,
      charts: updatedCharts,
    };

    // Actualizamos tanto la plantilla activa como la plantilla personalizada.
    // Esto garantiza que si el usuario se mantiene en su plantilla, conmuta entre pestañas
    // o recarga la página, los gráficos añadidos persisten y quedan siempre en pantalla.
    const nextTemplates = templates
      .filter((t) => t.id !== 'template-custom')
      .map((t) => (t.id === activeTemplateId ? { ...t, charts: updatedCharts } : t));
    nextTemplates.push(customTemplateObj);

    saveTemplatesState(nextTemplates, 'template-custom');
    toast.success(
      `¡Gráfico añadido y guardado en tu panel! (${updatedCharts.length}/5)`,
    );
  };

  // Al pulsar Añadir en el catálogo se abre el menú para elegir qué datos mostrar
  const handleSelectWidgetDirectly = (chartType: ChartType) => {
    setPaletteOpen(false);
    setPendingDrop({ chartType });
  };

  // Manejo de Drag sobre la Zona Destacada Principal
  const handleProminentDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (charts.length >= MAX_CHARTS) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isProminentOver) setIsProminentOver(true);
  };

  const handleProminentDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsProminentOver(false);
    }
  };

  // Manejo de Drop en la Zona Destacada Principal (se añade y queda de inmediato)
  const handleProminentDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProminentOver(false);
    setIsDraggingWidget(false);
    setDraggedWidgetType(null);
    draggedWidgetTypeRef.current = null;
    setPaletteOpen(false);

    if (charts.length >= MAX_CHARTS) {
      toast.error('Límite alcanzado: Máximo 5 gráficos simultáneos permitidos por plantilla');
      return;
    }

    let chartType: ChartType =
      draggedWidgetType ?? draggedWidgetTypeRef.current ?? 'BAR';
    try {
      const dataStr =
        e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
      if (dataStr) {
        const parsed = JSON.parse(dataStr) as DragItemPayload;
        if (parsed.type === 'NEW_WIDGET') chartType = parsed.chartType;
      }
    } catch {
      // Se conserva el tipo registrado al iniciar el arrastre
    }
    setPendingDrop({ chartType });
  };

  // Manejo de Drop tanto en DropZones intermedias como directamente sobre tarjetas para reordenar
  const handleDropPayload = (targetIndex: number, payload: DragItemPayload) => {
    setIsDraggingWidget(false);
    setDraggedWidgetType(null);
    draggedWidgetTypeRef.current = null;
    setIsProminentOver(false);
    setPaletteOpen(false);

    if (payload.type === 'NEW_WIDGET') {
      if (charts.length >= MAX_CHARTS) {
        toast.error('Límite alcanzado: Máximo 5 gráficos simultáneos permitidos por plantilla');
        return;
      }
      setPendingDrop({ chartType: payload.chartType, targetIndex });
    } else if (payload.type === 'REORDER') {
      const sourceIndex = payload.sourceIndex;
      if (sourceIndex === targetIndex) {
        return;
      }
      const updated = [...charts];
      const [moved] = updated.splice(sourceIndex, 1);
      if (moved) {
        updated.splice(targetIndex, 0, moved);
        const nextTemplates = templates.map((t) =>
          t.id === activeTemplateId ? { ...t, charts: updated } : t,
        );
        saveTemplatesState(nextTemplates, activeTemplateId);
        toast.info(`Gráficos reordenados: movido a posición #${targetIndex + 1}`);
      }
    }
  };

  const handleConfirmPostDrop = (newChart: MetricQueryInput, targetIndex?: number) => {
    if (charts.length >= MAX_CHARTS) {
      toast.error(`Límite alcanzado: máximo ${MAX_CHARTS} gráficos simultáneos por plantilla`);
      setPendingDrop(null);
      return;
    }

    addChartToActiveTemplate(newChart, targetIndex);
    setPendingDrop(null);
  };

  const handleCancelPostDrop = () => {
    setPendingDrop(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Visualización flotante del gráfico en movimiento que sigue el cursor del mouse */}
      <DragGhostPreview
        chartType={draggedWidgetType}
        position={mousePos}
        isDragging={isDraggingWidget}
      />

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
              Métricas del pañol. Arrastra un gráfico desde el catálogo o pulsa Añadir, y elige qué datos mostrar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón único para añadir gráficos: Abrir Catálogo de Widgets */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenWidgetCatalog}
              disabled={charts.length >= MAX_CHARTS}
              className="text-xs gap-1.5 border-sky-300 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 font-medium"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Abrir Catálogo de Widgets ({charts.length}/5)</span>
            </Button>

            {/* Toggle Modo Edición / Guardar y Salir */}
            <Button
              type="button"
              variant={isEditMode ? 'primary' : 'outline'}
              size="sm"
              onClick={handleToggleEditMode}
              className={`text-xs gap-1.5 ${
                isEditMode
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-xs'
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
          </div>
        </div>
      </div>

      {/* Banner Informativo en Modo Edición */}
      {isEditMode && !isDraggingWidget && (
        <div
          data-testid="edit-mode-banner"
          className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 text-xs font-mono text-sky-700 dark:text-sky-400"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>
              <strong>Modo Edición Activo:</strong> Añade gráficos desde el Catálogo de Widgets (arrastrando o pulsando Añadir).
              Al elegir un tipo se abre un menú para definir qué datos mostrar. Máximo 5 gráficos simultáneos.
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="text-xs h-7 gap-1 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300"
          >
            <Palette className="h-3 w-3" />
            <span>Ver Catálogo</span>
          </Button>
        </div>
      )}

      {/* Banner de Enfoque Activo cuando se arrastra un widget desde la paleta */}
      {isDraggingWidget && (
        <div
          data-testid="drag-focus-banner"
          className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-sky-950/40 border-2 border-sky-500/80 text-xs font-mono text-sky-300 shadow-md animate-pulse"
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-400 animate-spin" />
            <span>
              <strong>Zonas de Inserción Enfocadas:</strong> Suelta el gráfico en la zona principal o en cualquier ranura para configurarlo.
            </span>
          </div>
          <span className="text-[11px] text-sky-400">
            {charts.length < 5 ? `Espacio disponible (${charts.length}/5)` : 'Límite de 5 alcanzado'}
          </span>
        </div>
      )}

      {/* Cinta Métrica Compacta Superior (Executive KPIs) */}
      <MetricStrip kpis={kpis} isLoading={isLoadingKpis} error={kpisError} />

      {/* Selector de Plantillas (Guardado y Sincronizado por Plantilla) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <LayoutGrid className="h-4 w-4" />
          <span>Plantillas de Análisis:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {templates.map((tmpl) => {
            const isActive = activeTemplateId === tmpl.id;
            const isCustom = tmpl.id === 'template-custom';
            return (
              <Button
                key={tmpl.id}
                type="button"
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSelectTemplate(tmpl)}
                className={`text-xs gap-1.5 ${
                  isActive
                    ? isCustom
                      ? 'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 border-transparent shadow-xs'
                      : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : isCustom
                      ? 'border-amber-400/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {isCustom && <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
                <span>
                  {tmpl.name}
                  {isCustom ? ` (${tmpl.charts.length})` : ''}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* ZONA PRINCIPAL DE SOLTADO (Prominent Drop Zone) que resalta visiblemente de las demás */}
      {isEditMode && (isDraggingWidget || paletteOpen) && (
        <div
          data-testid="prominent-drop-zone"
          onDragOver={handleProminentDragOver}
          onDragEnter={handleProminentDragOver}
          onDragLeave={handleProminentDragLeave}
          onDrop={handleProminentDrop}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-xl border-2 border-dashed transition-all duration-200 select-none shadow-xl cursor-copy',
            isProminentOver
              ? 'border-emerald-400 bg-emerald-950/60 text-emerald-100 shadow-emerald-500/30 scale-[1.01]'
              : 'border-sky-500 bg-gradient-to-r from-sky-950/50 via-zinc-900/90 to-sky-950/50 text-zinc-100 shadow-sky-500/25 animate-pulse',
          )}
        >
          <div className="pointer-events-none select-none flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-300 bg-sky-950/90 border border-sky-500/60 px-3 py-1 rounded-full shadow-xs">
                ★ Zona Principal de Soltado Destacada ★
              </span>
            </div>

            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-400 shrink-0">
                <Target className="h-6 w-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {isProminentOver
                    ? '¡Suelta aquí para configurar el gráfico!'
                    : 'Suelta tu gráfico aquí para configurarlo'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Al soltar se abre el menú para elegir qué datos mostrar ({charts.length + 1}/5)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Gráficos y Zonas de Soltado (Drag & Drop Canvas) */}
      {charts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center font-mono text-xs text-zinc-400 gap-3">
          <BarChart3 className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p>No hay gráficos activos en esta plantilla. Abre el Catálogo de Widgets para añadir nuevos gráficos.</p>
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenWidgetCatalog}
              className="text-xs gap-1.5 border-sky-300 dark:border-sky-900/60 text-sky-600 dark:text-sky-400"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Abrir Catálogo de Widgets</span>
            </Button>
            {isEditMode && (
              <DropZone
                index={0}
                disabled={false}
                isFocused={isDraggingWidget}
                draggedWidgetType={draggedWidgetType}
                onDropPayload={handleDropPayload}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {isEditMode ? (
            <div className="flex flex-col gap-4">
              {/* DropZone al inicio (Posición 0) */}
              <DropZone
                index={0}
                disabled={charts.length >= MAX_CHARTS}
                isFocused={isDraggingWidget}
                draggedWidgetType={draggedWidgetType}
                onDropPayload={handleDropPayload}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {charts.map((chart, idx) => (
                  <div
                    key={`${chart.entity}_${chart.metric}_${chart.chartType}_${chart.timeRange}_${chart.groupBy || ''}_${idx}`}
                    className="flex flex-col gap-3"
                  >
                    <DynamicChartCard
                      index={idx}
                      isEditMode={true}
                      input={chart}
                      onDelete={() => setChartToDeleteIndex(idx)}
                      onDropPayload={handleDropPayload}
                    />

                    {/* DropZone intermedia tras cada tarjeta */}
                    <DropZone
                      index={idx + 1}
                      disabled={charts.length >= MAX_CHARTS}
                      isFocused={isDraggingWidget}
                      draggedWidgetType={draggedWidgetType}
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
                  key={`${chart.entity}_${chart.metric}_${chart.timeRange}_${chart.chartType}_${chart.groupBy || ''}_${idx}`}
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
        onWidgetDragStart={handleWidgetDragStart}
        onWidgetDragEnd={handleWidgetDragEnd}
        onSelectWidget={handleSelectWidgetDirectly}
        isDraggingWidget={isDraggingWidget}
      />

      {/* Asistente Contextual Post-Drop (al soltar una forma en una DropZone o sobre otra tarjeta) */}
      {pendingDrop && (
        <ChartConfigModal
          open={true}
          onClose={handleCancelPostDrop}
          onConfirm={handleConfirmPostDrop}
          chartType={pendingDrop.chartType}
          targetIndex={pendingDrop.targetIndex}
          currentCharts={charts}
        />
      )}

      {/* Diálogo de Confirmación para eliminar gráfico */}
      <ConfirmDialog
        open={chartToDeleteIndex !== null}
        onCancel={() => setChartToDeleteIndex(null)}
        onConfirm={handleConfirmDelete}
        title="¿Retirar gráfico del panel?"
        description="Esta visualización será retirada de tu plantilla activa. Puedes volver a agregarla desde el Catálogo de Widgets cuando desees."
        confirmLabel="Retirar Gráfico"
        cancelLabel="Conservar"
        variant="danger"
      />
    </div>
  );
}
