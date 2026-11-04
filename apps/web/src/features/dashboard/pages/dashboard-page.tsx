import { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Eye,
  LayoutGrid,
  Pencil,
  Check,
  Palette,
  SlidersHorizontal,
  Target,
  Plus,
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
import { useMyPanel, pickGenericTemplate } from '../hooks/use-my-panel';
import {
  MAX_CHARTS,
  type ChartType,
  type DragItemPayload,
  type MetricQueryInput,
} from '../types/metrics';
import type { ChartTemplate } from '@sgia/types';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

export default function DashboardPage() {
  const {
    data: kpis,
    isLoading: isLoadingKpis,
    error: kpisError,
  } = useApiClientExecutiveKpis('LAST_30_DAYS');

  // Panel personal (REQ-15): los gráficos viven en el servidor (`/api/me/charts`), máximo 5.
  const panel = useMyPanel();
  const panelCharts = panel.visible;
  const charts = panelCharts.map((c) => c.input);

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

  /** Ejecuta una operación contra el servidor mostrando su error (422: posición ocupada, límite, etc.). */
  const run = async (action: () => Promise<unknown>, successMessage?: string) => {
    try {
      await action();
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(apiErrorToMessage(error));
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

  const handleConfirmDelete = async () => {
    if (chartToDeleteIndex === null) return;
    const target = panelCharts[chartToDeleteIndex];
    setChartToDeleteIndex(null);
    if (!target) return;
    await run(() => panel.remove(target.id), 'Gráfico eliminado de tu panel');
  };

  const handleHide = (index: number) => {
    const target = panelCharts[index];
    if (target) void run(() => panel.hide(target.id), 'Gráfico oculto (conserva su posición)');
  };

  const handleAddFromTemplate = (template: ChartTemplate) => {
    if (!panel.canAdd) {
      toast.error(`Límite alcanzado: máximo ${MAX_CHARTS} gráficos por usuario`);
      return;
    }
    void run(() => panel.addChart(template), `Gráfico "${template.name}" añadido a tu panel`);
  };

  // Toggle de Modo Edición con persistencia explícita en "Guardar y Salir"
  const handleToggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setPaletteOpen(false);
      setIsDraggingWidget(false);
      setDraggedWidgetType(null);
      draggedWidgetTypeRef.current = null;
      setIsProminentOver(false);
      toast.success('Distribución guardada en tu cuenta');
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

  // Añade un gráfico al panel: se crea en el servidor desde la plantilla genérica de su forma
  const addChartToPanel = async (newChart: MetricQueryInput, targetIndex?: number) => {
    if (!panel.canAdd) {
      toast.error(`Límite alcanzado: máximo ${MAX_CHARTS} gráficos por usuario`);
      return;
    }
    const template = pickGenericTemplate(panel.templates, newChart.chartType);
    if (!template) {
      toast.error('No hay plantillas de gráfico disponibles en el servidor.');
      return;
    }
    await run(
      () => panel.addChart(template, newChart, targetIndex),
      `¡Gráfico añadido a tu panel! (${panel.total + 1}/${MAX_CHARTS})`,
    );
  };

  // Al pulsar Añadir en el catálogo se abre el menú para elegir qué datos mostrar
  const handleSelectWidgetDirectly = (chartType: ChartType) => {
    setPaletteOpen(false);
    setPendingDrop({ chartType });
  };

  // Manejo de Drag sobre la Zona Destacada Principal
  const handleProminentDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!panel.canAdd) return;
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

    if (!panel.canAdd) {
      toast.error('Límite alcanzado: Máximo 5 gráficos por usuario');
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
      if (!panel.canAdd) {
        toast.error('Límite alcanzado: Máximo 5 gráficos por usuario');
        return;
      }
      setPendingDrop({ chartType: payload.chartType, targetIndex });
    } else if (payload.type === 'REORDER') {
      const sourceIndex = payload.sourceIndex;
      if (sourceIndex === targetIndex) {
        return;
      }
      void run(
        () => panel.reorder(sourceIndex, targetIndex),
        `Gráficos reordenados: movido a posición #${targetIndex + 1}`,
      );
    }
  };

  const handleConfirmPostDrop = (newChart: MetricQueryInput, targetIndex?: number) => {
    setPendingDrop(null);
    void addChartToPanel(newChart, targetIndex);
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
              disabled={!panel.canAdd}
              className="text-xs gap-1.5 border-sky-300 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 font-medium"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Abrir Catálogo de Widgets ({panel.total}/5)</span>
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
            {panel.canAdd ? `Espacio disponible (${panel.total}/5)` : 'Límite de 5 alcanzado'}
          </span>
        </div>
      )}

      {/* Cinta Métrica Compacta Superior (Executive KPIs) */}
      <MetricStrip kpis={kpis} isLoading={isLoadingKpis} error={kpisError} />

      {/* Plantillas sembradas del servidor: añaden un gráfico a tu panel (máximo 5 por usuario) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <LayoutGrid className="h-4 w-4" />
          <span>Plantillas de Análisis:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {panel.templates
            .filter((t) => t.entity !== null)
            .map((tmpl) => (
              <Button
                key={tmpl.id}
                type="button"
                variant="outline"
                size="sm"
                disabled={!panel.canAdd || panel.isMutating}
                onClick={() => handleAddFromTemplate(tmpl)}
                title={tmpl.description ?? `Añadir "${tmpl.name}" a tu panel`}
                className="text-xs gap-1.5 text-zinc-600 dark:text-zinc-400"
              >
                <Plus className="h-3 w-3" />
                <span>{tmpl.name}</span>
              </Button>
            ))}
          {panel.templates.every((t) => t.entity === null) && (
            <span className="font-mono text-[11px] text-zinc-400">
              {panel.isLoading ? 'Cargando plantillas…' : 'Sin plantillas con consulta predefinida.'}
            </span>
          )}
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
                  Al soltar se abre el menú para elegir qué datos mostrar ({panel.total + 1}/5)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Gráficos y Zonas de Soltado (Drag & Drop Canvas) */}
      {panel.isLoading ? (
        <div className="p-12 text-center font-mono text-xs text-zinc-400">Cargando tu panel…</div>
      ) : panel.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-700 dark:text-red-400"
        >
          {apiErrorToMessage(panel.error)}
        </div>
      ) : charts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center font-mono text-xs text-zinc-400 gap-3">
          <BarChart3 className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p>Tu panel no tiene gráficos visibles. Añade una plantilla o abre el Catálogo de Widgets.</p>
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
                disabled={!panel.canAdd}
                isFocused={isDraggingWidget}
                draggedWidgetType={draggedWidgetType}
                onDropPayload={handleDropPayload}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {panelCharts.map((item, idx) => (
                  <div key={item.id} className="flex flex-col gap-3">
                    <DynamicChartCard
                      index={idx}
                      isEditMode={true}
                      input={item.input}
                      visualization={item.visualization}
                      onDelete={() => setChartToDeleteIndex(idx)}
                      onHide={() => handleHide(idx)}
                      onDropPayload={handleDropPayload}
                    />

                    {/* DropZone intermedia tras cada tarjeta */}
                    <DropZone
                      index={idx + 1}
                      disabled={!panel.canAdd}
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
              {panelCharts.map((item, idx) => (
                <DynamicChartCard
                  key={item.id}
                  index={idx}
                  isEditMode={false}
                  input={item.input}
                  visualization={item.visualization}
                  onDelete={() => setChartToDeleteIndex(idx)}
                  onHide={() => handleHide(idx)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gráficos ocultos: siguen ocupando una de las 5 posiciones hasta eliminarlos */}
      {panel.hidden.length > 0 && (
        <section
          aria-label="Gráficos ocultos"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
        >
          <h2 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Ocultos ({panel.hidden.length})
          </h2>
          <ul className="flex flex-col gap-1.5">
            {panel.hidden.map((hiddenChart) => (
              <li key={hiddenChart.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-zinc-700 dark:text-zinc-300">
                  {hiddenChart.custom_title ?? hiddenChart.template?.name ?? `Gráfico #${hiddenChart.id}`}
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => void run(() => panel.show(hiddenChart.id), 'Gráfico visible de nuevo')}
                  >
                    <Eye className="h-3 w-3" />
                    Mostrar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-xs text-rose-600"
                    onClick={() => void run(() => panel.remove(hiddenChart.id), 'Gráfico eliminado')}
                  >
                    Eliminar
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Panel Lateral Retráctil de Widgets Genéricos (Widget Palette Drawer) */}
      <WidgetPaletteDrawer
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        currentChartsCount={panel.total}
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
