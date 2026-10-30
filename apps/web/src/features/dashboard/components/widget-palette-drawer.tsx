import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, TrendingUp, Compass, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ChartType } from '../types/metrics';

interface WidgetShapeItem {
  type: ChartType;
  title: string;
  subtitle: string;
  description: string;
  badges: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const WIDGET_SHAPES: WidgetShapeItem[] = [
  {
    type: 'BAR',
    title: 'Gráfico de Barras (BAR)',
    subtitle: 'Comparativas discretas y rankings',
    description: 'Ideal para niveles de stock, consumos por carrera y comparativas entre categorías del pañol.',
    badges: ['Discreto', 'Rankings', 'Inventario'],
    icon: BarChart3,
  },
  {
    type: 'DOUGHNUT',
    title: 'Gráfico de Torta / Dona (DOUGHNUT)',
    subtitle: 'Proporciones y cuotas relativas',
    description: 'Adecuado para tasas porcentuales, estado de préstamos y distribución de fallas.',
    badges: ['Proporción', 'Tasas', 'Distribución'],
    icon: PieChart,
  },
  {
    type: 'LINE',
    title: 'Series de Tiempo / Línea (LINE)',
    subtitle: 'Tendencias cronológicas continuas',
    description: 'Visualiza la evolución temporal de préstamos semanales, incidencias y flujos del pañol.',
    badges: ['Cronológico', 'Tendencias', 'Flujos'],
    icon: TrendingUp,
  },
  {
    type: 'POLAR_AREA',
    title: 'Gráfico de Área Polar (POLAR_AREA)',
    subtitle: 'Frecuencias multivariables cíclicas',
    description: 'Óptimo para demanda por asignaturas simultáneas, especialidades y ciclos semestrales.',
    badges: ['Multivariable', 'Ciclos', 'Asignaturas'],
    icon: Compass,
  },
];

interface WidgetPaletteDrawerProps {
  open: boolean;
  onClose: () => void;
  currentChartsCount: number;
  onWidgetDragStart?: (chartType: ChartType, clientPos?: { x: number; y: number }) => void;
  onWidgetDragEnd?: () => void;
  onSelectWidget?: (chartType: ChartType) => void;
  isDraggingWidget?: boolean;
}

export function WidgetPaletteDrawer({
  open,
  onClose,
  currentChartsCount,
  onWidgetDragStart,
  onWidgetDragEnd,
  onSelectWidget,
  isDraggingWidget = false,
}: WidgetPaletteDrawerProps) {
  const isMaxCapacity = currentChartsCount >= 5;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, chartType: ChartType) => {
    if (isMaxCapacity) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'NEW_WIDGET', chartType }),
    );
    try {
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ type: 'NEW_WIDGET', chartType }),
      );
    } catch {
      // Ignorar navegadores antiguos
    }
    e.dataTransfer.effectAllowed = 'copy';

    // Reportamos las coordenadas iniciales del cursor al iniciar el arrastre
    onWidgetDragStart?.(chartType, { x: e.clientX, y: e.clientY });
  };

  return (
    <Sheet open={open} modal={false} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        overlayClassName={cn(
          'pointer-events-none transition-opacity duration-300',
          isDraggingWidget ? 'opacity-0' : 'opacity-100 bg-black/20 backdrop-blur-2xs',
        )}
        className={cn(
          'w-full sm:max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex flex-col p-6 overflow-y-auto transition-transform duration-300',
          isDraggingWidget && 'translate-x-[92%] opacity-30 shadow-none',
        )}
      >
        <SheetHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-600 dark:text-sky-500 font-semibold uppercase tracking-wider">
            <span>Catálogo</span>
            <span className="text-zinc-400">/</span>
            <span>Paleta de Formas</span>
          </div>
          <SheetTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Formas Gráficas Genéricas
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Arrastra una forma hacia el lienzo o pulsa «Añadir», y elige qué datos mostrar.
          </SheetDescription>
        </SheetHeader>

        {isMaxCapacity && (
          <div
            data-testid="palette-max-capacity-warning"
            className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-mono"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Límite de 5 gráficos alcanzado. Retira un gráfico del panel para añadir nuevos.</span>
          </div>
        )}

        <div className="flex flex-col gap-3.5 mt-2">
          {WIDGET_SHAPES.map((shape) => {
            const Icon = shape.icon;
            return (
              <div
                key={shape.type}
                data-testid={`widget-item-${shape.type.toLowerCase()}`}
                draggable={!isMaxCapacity}
                onDragStart={(e) => handleDragStart(e, shape.type)}
                onDragEnd={() => onWidgetDragEnd?.()}
                onClick={() => {
                  if (!isMaxCapacity && onSelectWidget) {
                    onSelectWidget(shape.type);
                  }
                }}
                className={`flex flex-col gap-2 rounded-lg border p-3.5 transition-all select-none ${
                  isMaxCapacity
                    ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-60 cursor-not-allowed'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-sky-500/60 hover:shadow-xs cursor-grab active:cursor-grabbing'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {shape.title}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {shape.subtitle}
                      </div>
                    </div>
                  </div>
                  <Badge tone="neutral" className="text-[10px] font-mono">
                    {shape.type}
                  </Badge>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {shape.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {shape.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60"
                    >
                      {b}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Arrastra o pulsa Añadir
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isMaxCapacity}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWidget?.(shape.type);
                    }}
                    className="h-6 text-[11px] px-2.5 gap-1 border-sky-300 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 font-medium"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Añadir</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
