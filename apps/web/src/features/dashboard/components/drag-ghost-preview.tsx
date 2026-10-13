import { BarChart3, PieChart, TrendingUp, Compass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChartType } from '../types/metrics';

interface DragGhostPreviewProps {
  chartType: ChartType | null;
  position: { x: number; y: number };
  isDragging: boolean;
}

const SHAPE_CONFIGS: Record<
  ChartType,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
    renderMiniVisual: () => React.ReactNode;
  }
> = {
  BAR: {
    title: 'Gráfico de Barras',
    subtitle: 'Inventario y consumos discretos',
    icon: BarChart3,
    badge: 'BAR',
    renderMiniVisual: () => (
      <div className="flex items-end justify-between h-14 bg-zinc-950/80 rounded-md p-2 border border-zinc-800 gap-1.5">
        <div className="w-full h-[40%] bg-red-600/70 rounded-t" />
        <div className="w-full h-[75%] bg-red-500 rounded-t" />
        <div className="w-full h-[55%] bg-amber-500/80 rounded-t" />
        <div className="w-full h-[95%] bg-emerald-500 rounded-t" />
        <div className="w-full h-[65%] bg-cyan-500/80 rounded-t" />
      </div>
    ),
  },
  LINE: {
    title: 'Series de Tiempo',
    subtitle: 'Tendencias y flujo cronológico',
    icon: TrendingUp,
    badge: 'LINE',
    renderMiniVisual: () => (
      <div className="h-14 bg-zinc-950/80 rounded-md p-2 border border-zinc-800 flex items-center justify-center">
        <svg className="w-full h-10 overflow-visible" viewBox="0 0 100 40">
          <path
            d="M 5 32 Q 25 10 45 22 T 85 8 L 95 18"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="85" cy="8" r="3" fill="#ef4444" className="animate-ping" />
          <circle cx="85" cy="8" r="3" fill="#ffffff" />
        </svg>
      </div>
    ),
  },
  DOUGHNUT: {
    title: 'Gráfico de Torta / Dona',
    subtitle: 'Proporciones relativas y cuotas',
    icon: PieChart,
    badge: 'DOUGHNUT',
    renderMiniVisual: () => (
      <div className="h-14 bg-zinc-950/80 rounded-md p-1 border border-zinc-800 flex items-center justify-center">
        <svg className="h-11 w-11" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="transparent" stroke="#27272a" strokeWidth="5" />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="transparent"
            stroke="#ef4444"
            strokeWidth="5"
            strokeDasharray="40 100"
            strokeDashoffset="25"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="transparent"
            stroke="#10b981"
            strokeWidth="5"
            strokeDasharray="25 100"
            strokeDashoffset="85"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth="5"
            strokeDasharray="20 100"
            strokeDashoffset="60"
          />
        </svg>
      </div>
    ),
  },
  POLAR_AREA: {
    title: 'Gráfico de Área Polar',
    subtitle: 'Frecuencias multivariables cícilicas',
    icon: Compass,
    badge: 'POLAR_AREA',
    renderMiniVisual: () => (
      <div className="h-14 bg-zinc-950/80 rounded-md p-1 border border-zinc-800 flex items-center justify-center">
        <svg className="h-11 w-11" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="transparent" stroke="#27272a" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="18" cy="18" r="9" fill="transparent" stroke="#3f3f46" strokeWidth="1" strokeDasharray="2 2" />
          <polygon
            points="18,6 26,14 24,24 12,25 10,15"
            fill="rgba(239, 68, 68, 0.4)"
            stroke="#ef4444"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    ),
  },
};

export function DragGhostPreview({
  chartType,
  position,
  isDragging,
}: DragGhostPreviewProps) {
  if (!isDragging || !chartType) {
    return null;
  }

  const config = SHAPE_CONFIGS[chartType];
  if (!config) return null;

  const Icon = config.icon;

  // Calculamos la posición offset para no tapar el cursor ni las zonas receptoras
  const top = Math.max(10, position.y + 14);
  const left = Math.max(10, position.x + 14);

  return (
    <div
      data-testid="drag-ghost-preview"
      data-chart-type={chartType}
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
      className="w-72 select-none rounded-xl border-2 border-red-500 bg-zinc-900/95 dark:bg-zinc-950/95 p-3.5 shadow-2xl shadow-red-500/30 backdrop-blur-md text-zinc-100 flex flex-col gap-2.5 transition-transform duration-75 ease-out"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-red-600/20 text-red-400 border border-red-500/40">
            <Icon className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 leading-tight">
              {config.title}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono leading-none">
              {config.subtitle}
            </div>
          </div>
        </div>
        <Badge tone="danger" className="text-[10px] font-mono px-1.5 py-0.5">
          {config.badge}
        </Badge>
      </div>

      {/* Visualización representativa del gráfico en movimiento */}
      <div className="w-full">
        {config.renderMiniVisual()}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-zinc-800">
        <span className="flex items-center gap-1.5 text-red-400 font-semibold" data-testid="drag-ghost-status">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          Arrastrando gráfico...
        </span>
        <span className="text-zinc-500 text-[10px]">Suelta en una zona</span>
      </div>
    </div>
  );
}
