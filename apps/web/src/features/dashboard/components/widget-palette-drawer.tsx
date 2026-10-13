import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChart, TrendingUp, Compass, AlertCircle } from 'lucide-react';
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
}

export function WidgetPaletteDrawer({
  open,
  onClose,
  currentChartsCount,
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
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex flex-col p-6 overflow-y-auto"
      >
        <SheetHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-mono text-red-600 dark:text-red-500 font-semibold uppercase tracking-wider">
            <span>Catálogo zed.dev</span>
            <span className="text-zinc-400">/</span>
            <span>Paleta de Formas</span>
          </div>
          <SheetTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Formas Gráficas Genéricas
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Arrastra una forma hacia el lienzo para abrir el asistente de configuración analítica.
          </SheetDescription>
        </SheetHeader>

        {isMaxCapacity && (
          <div
            data-testid="palette-max-capacity-warning"
            className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-mono"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Límite de 5 gráficos alcanzado. Retira un gráfico del panel para arrastrar nuevos.</span>
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
                className={`flex flex-col gap-2 rounded-lg border p-3.5 transition-all select-none ${
                  isMaxCapacity
                    ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-60 cursor-not-allowed'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-red-500/60 hover:shadow-xs cursor-grab active:cursor-grabbing'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {shape.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {shape.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                    {isMaxCapacity ? 'Bloqueado' : 'Arrastrable'}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {shape.description}
                </p>

                {/* Previsualización miniatura vectorizada */}
                <div className="h-14 w-full rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center p-2 overflow-hidden">
                  {shape.type === 'BAR' && (
                    <div className="flex items-end gap-2 h-full w-3/4 justify-center">
                      <div className="w-3 bg-red-500/80 rounded-t h-[40%]" />
                      <div className="w-3 bg-red-500/80 rounded-t h-[75%]" />
                      <div className="w-3 bg-red-500/80 rounded-t h-[55%]" />
                      <div className="w-3 bg-red-500/80 rounded-t h-[90%]" />
                    </div>
                  )}
                  {shape.type === 'DOUGHNUT' && (
                    <div className="h-10 w-10 rounded-full border-4 border-red-500 border-t-cyan-500 border-r-amber-500 border-b-emerald-500" />
                  )}
                  {shape.type === 'LINE' && (
                    <svg className="h-8 w-4/5 text-red-500" viewBox="0 0 100 30" fill="none">
                      <path
                        d="M 5 22 Q 25 5, 50 18 T 95 8"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                      />
                    </svg>
                  )}
                  {shape.type === 'POLAR_AREA' && (
                    <div className="relative h-10 w-10 flex items-center justify-center">
                      <div className="absolute h-10 w-10 rounded-full border border-dashed border-zinc-400/40" />
                      <div className="absolute h-8 w-8 rounded-full bg-red-500/30" />
                      <div className="absolute h-5 w-5 rounded-full bg-cyan-500/50" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {shape.badges.map((b) => (
                    <Badge
                      key={b}
                      tone="neutral"
                      mono
                      className="text-[10px] py-0 px-1.5 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
