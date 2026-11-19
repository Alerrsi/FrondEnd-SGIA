import {
  Boxes,
  CalendarClock,
  Wrench,
  AlertOctagon,
  Percent,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { apiErrorToMessage } from '@/lib/api-error';
import type { ExecutiveKpis } from '../types/metrics';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricStripProps {
  kpis?: ExecutiveKpis;
  isLoading?: boolean;
  error?: unknown;
}

export function MetricStrip({ kpis, isLoading, error }: MetricStripProps) {
  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-zinc-900 p-3 font-mono text-xs text-rose-600 dark:text-rose-400"
      >
        No se pudieron cargar los indicadores: {apiErrorToMessage(error)}
      </div>
    );
  }

  if (isLoading || !kpis) {
    return (
      <Skeleton label="Cargando indicadores ejecutivos…" className="h-11 w-full" />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono shadow-xs overflow-hidden">
      {/* 1. Activos Disponibles */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <CheckCircle2 aria-hidden="true" className="h-3 w-3 text-emerald-500" />
          <span>Disponibles</span>
        </div>
        <span className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.activosDisponibles}
        </span>
      </div>

      {/* 2. En préstamo */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Boxes aria-hidden="true" className="h-3 w-3 text-blue-500" />
          <span>En préstamo</span>
        </div>
        <span className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.activosEnPrestamo}
        </span>
      </div>

      {/* 3. En taller / Mantención */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Wrench aria-hidden="true" className="h-3 w-3 text-amber-500" />
          <span>En taller</span>
        </div>
        <span className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.activosEnTaller}
        </span>
      </div>

      {/* 4. De baja */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <AlertOctagon aria-hidden="true" className="h-3 w-3 text-zinc-400" />
          <span>De baja</span>
        </div>
        <span className="mt-1 text-base font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
          {kpis.activosDeBaja}
        </span>
      </div>

      {/* 5. Préstamos hoy */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <CalendarClock aria-hidden="true" className="h-3 w-3 text-indigo-500" />
          <span>Préstamos hoy</span>
        </div>
        <span className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.prestamosActivosHoy}
        </span>
      </div>

      {/* 6. Tasa de Atrasos */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Percent aria-hidden="true" className="h-3 w-3 text-rose-500" />
          <span>Tasa atrasos</span>
        </div>
        <span className="mt-1 text-base font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
          {kpis.tasaAtrasosPct}%
        </span>
      </div>

      {/* 7. Alertas Críticas */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <AlertOctagon aria-hidden="true" className="h-3 w-3 text-red-600 animate-pulse" />
          <span>Alertas stock</span>
        </div>
        <span className="mt-1 text-base font-semibold text-red-600 dark:text-red-500 tabular-nums">
          {kpis.alertasCriticasNoResueltas}
        </span>
      </div>

      {/* 8. Tasa Rotación */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <TrendingUp aria-hidden="true" className="h-3 w-3 text-teal-500" />
          <span>Rotación mes</span>
        </div>
        <span className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.tasaRotacionMensualPct}%
        </span>
      </div>
    </div>
  );
}
