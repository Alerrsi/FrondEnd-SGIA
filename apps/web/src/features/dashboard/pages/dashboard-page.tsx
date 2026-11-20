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
import { DashboardTemplateBar } from '../components/dashboard-template-bar';
import { PanelBusyError, useMyPanel, pickTemplateFor } from '../hooks/use-my-panel';
import {
  MAX_CHARTS,
  type ChartType,
  type DragItemPayload,
  type MetricQueryInput,
} from '../types/metrics';
import type { ChartTemplate } from '@sgia/types';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionLabel } from '@/components/ui/section-label';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const {
    data: kpis,
    isLoading: isLoadingKpis,
    error: kpisError,
  } = useApiClientExecutiveKpis('LAST_30_DAYS');

  // Panel personal (REQ-15): los gráficos viven en el servidor (`/api/me/charts`), máximo 9 por plantilla.
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const panel = useMyPanel(selectedTemplateId);
  const panelCharts = panel.visible;

  // Modo edición / Visualización
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
      if (error instanceof PanelBusyError) return;
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
      toast.error(`Límite alcanzado: máximo ${MAX_CHARTS} gráficos por plantilla`);
      return;
    }
    if (panel.hasTemplate(template)) {
      toast.error(`"${template.name}" ya está en tu panel`);
      return;
    }
    void run(() => panel.addChart(template), `Gráfico "${template.name}" añadido a tu panel`);
  };

  // Toggle de Modo edición con persistencia explícita en "Guardar y salir"
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

  // Añade un gráfico al panel: queda asociado a la plantilla del servidor con esa misma consulta
  // o, si es una consulta propia, a la plantilla genérica de su forma
  const addChartToPanel = async (newChart: MetricQueryInput, targetIndex?: number) => {
    if (!panel.canAdd) {
      toast.error(`Límite alcanzado: máximo ${MAX_CHARTS} gráficos por plantilla`);
      return;
    }
    const template = pickTemplateFor(panel.templates, newChart);
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
      toast.error(`Límite alcanzado: máximo ${MAX_CHARTS} gráficos por plantilla`);
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
        toast.error(`Límite alcanzado: máximo ${MAX_CHARTS} gráficos por plantilla`);
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

      <PageHeader
        icon={BarChart3}
        title="Analítica"
        description="Métricas del pañol. Arrastra un gráfico desde el catálogo o pulsa Añadir, y elige qué datos mostrar."
        actions={
          <>
            <Button type="button" variant="outline" size="sm" onClick={handleOpenWidgetCatalog} disabled={!panel.canAdd}>
              <Palette aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Abrir catálogo de widgets ({panel.total}/{MAX_CHARTS})</span>
            </Button>
            <Button type="button" variant={isEditMode ? 'primary' : 'outline'} size="sm" onClick={handleToggleEditMode}>
              {isEditMode ? (
                <>
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>Guardar y salir</span>
                </>
              ) : (
                <>
                  <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>Modo edición</span>
                </>
              )}
            </Button>
          </>
        }
      />

      {/* Banner Informativo en Modo edición */}
      {isEditMode && !isDraggingWidget && (
        <div
          data-testid="edit-mode-banner"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent-soft px-4 py-3 text-[13px] text-accent"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>
              <strong>Modo edición activo:</strong> Añade gráficos desde el Catálogo de Widgets (arrastrando o pulsando Añadir).
              Al elegir un tipo se abre un menú para definir qué datos mostrar. Máximo {MAX_CHARTS} gráficos simultáneos.
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
          >
            <Palette aria-hidden="true" className="h-3 w-3" />
            <span>Ver catálogo</span>
          </Button>
        </div>
      )}

      {/* Banner de Enfoque Activo cuando se arrastra un widget desde la paleta */}
      {isDraggingWidget && (
        <div
          data-testid="drag-focus-banner"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-accent-soft px-4 py-3 text-[13px] text-accent"
        >
          <div className="flex items-center gap-2">
            <Target aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>
              <strong>Zonas de inserción enfocadas:</strong> Suelta el gráfico en la zona principal o en cualquier ranura para configurarlo.
            </span>
          </div>
          <span className="text-[13px]">
            {panel.canAdd ? `Espacio disponible (${panel.total}/${MAX_CHARTS})` : `Límite de ${MAX_CHARTS} alcanzado`}
          </span>
        </div>
      )}

      {/* Cinta Métrica Compacta Superior (Executive KPIs) */}
      <MetricStrip kpis={kpis} isLoading={isLoadingKpis} error={kpisError} />

      {/* Plantillas de dashboard con nombre: cada una agrupa hasta 9 gráficos */}
      <DashboardTemplateBar selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} />

      {/* Plantillas sembradas del servidor: añaden un gráfico a tu panel (máximo 9 por plantilla) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
          <LayoutGrid aria-hidden="true" className="h-4 w-4" />
          <span>Plantillas de análisis:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {panel.templates
            .filter((t) => t.entity !== null)
            .map((tmpl) => {
              const added = panel.hasTemplate(tmpl);
              return (
                <Button
                  key={tmpl.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={added || !panel.canAdd || panel.isMutating}
                  onClick={() => handleAddFromTemplate(tmpl)}
                  title={
                    added
                      ? `"${tmpl.name}" ya está en tu panel`
                      : (tmpl.description ?? `Añadir "${tmpl.name}" a tu panel`)
                  }
                >
                  {added ? <Check aria-hidden="true" className="h-3 w-3" /> : <Plus aria-hidden="true" className="h-3 w-3" />}
                  <span>{tmpl.name}</span>
                </Button>
              );
            })}
          {panel.templates.every((t) => t.entity === null) && (
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
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
            'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors duration-150 select-none cursor-copy sm:p-8',
            isProminentOver ? 'border-ok bg-ok-bg text-ok' : 'border-accent/50 bg-accent-soft text-accent',
          )}
        >
          <div className="pointer-events-none flex flex-col items-center gap-2">
            <Target aria-hidden="true" className="h-6 w-6" />
            <h3 className="text-sm font-medium">
              {isProminentOver ? 'Suelta aquí para configurar el gráfico' : 'Suelta tu gráfico aquí para configurarlo'}
            </h3>
            <p className="text-[13px] opacity-80">
              Al soltar se abre el menú para elegir qué datos mostrar ({panel.total + 1}/{MAX_CHARTS})
            </p>
          </div>
        </div>
      )}

      {/* Grid de Gráficos y Zonas de Soltado (Drag & Drop Canvas) */}
      {panel.isLoading ? (
        <div role="status" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <span className="sr-only">Cargando tu panel…</span>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : panel.error ? (
        <ErrorState>{apiErrorToMessage(panel.error)}</ErrorState>
      ) : panelCharts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-300 p-12 text-center text-[13px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <BarChart3 aria-hidden="true" className="h-6 w-6 text-zinc-400" />
          <p>Tu panel no tiene gráficos visibles. Añade una plantilla o abre el Catálogo de Widgets.</p>
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenWidgetCatalog}
            >
              <Palette aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Abrir catálogo de widgets</span>
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
          <SectionLabel as="h2" className="mb-2">Ocultos ({panel.hidden.length})</SectionLabel>
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
                    variant="outline" className="gap-1"
                    onClick={() => void run(() => panel.show(hiddenChart.id), 'Gráfico visible de nuevo')}
                  >
                    <Eye aria-hidden="true" className="h-3 w-3" />
                    Mostrar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost" className="text-danger"
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
          currentCharts={panel.inputs}
          usedSlots={panel.total}
          templates={panel.templates}
        />
      )}

      {/* Diálogo de Confirmación para eliminar gráfico */}
      <ConfirmDialog
        open={chartToDeleteIndex !== null}
        onCancel={() => setChartToDeleteIndex(null)}
        onConfirm={handleConfirmDelete}
        title="¿Retirar gráfico del panel?"
        description="Esta visualización será retirada de tu plantilla activa. Puedes volver a agregarla desde el Catálogo de Widgets cuando desees."
        confirmLabel="Retirar gráfico"
        cancelLabel="Conservar"
        variant="danger"
      />
    </div>
  );
}
