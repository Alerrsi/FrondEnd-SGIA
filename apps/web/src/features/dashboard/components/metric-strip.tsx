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
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs animate-pulse font-mono text-xs text-zinc-400">
        <span>Cargando indicadores ejecutivos…</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono shadow-xs overflow-hidden">
      {/* 1. Activos Disponibles */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span>Disponibles</span>
        </div>
        <span className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.activosDisponibles}
        </span>
      </div>

      {/* 2. En Préstamo */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <Boxes className="h-3 w-3 text-blue-500" />
          <span>En Préstamo</span>
        </div>
        <span className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.activosEnPrestamo}
        </span>
      </div>

      {/* 3. En Taller / Mantención */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <Wrench className="h-3 w-3 text-amber-500" />
          <span>En Taller</span>
        </div>
        <span className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.activosEnTaller}
        </span>
      </div>

      {/* 4. De Baja */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <AlertOctagon className="h-3 w-3 text-zinc-400" />
          <span>De Baja</span>
        </div>
        <span className="mt-1 text-base font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
          {kpis.activosDeBaja}
        </span>
      </div>

      {/* 5. Préstamos Hoy */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <CalendarClock className="h-3 w-3 text-indigo-500" />
          <span>Préstamos Hoy</span>
        </div>
        <span className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.prestamosActivosHoy}
        </span>
      </div>

      {/* 6. Tasa de Atrasos */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <Percent className="h-3 w-3 text-rose-500" />
          <span>Tasa Atrasos</span>
        </div>
        <span className="mt-1 text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
          {kpis.tasaAtrasosPct}%
        </span>
      </div>

      {/* 7. Alertas Críticas */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <AlertOctagon className="h-3 w-3 text-red-600 animate-pulse" />
          <span>Alertas Stock</span>
        </div>
        <span className="mt-1 text-base font-bold text-red-600 dark:text-red-500 tabular-nums">
          {kpis.alertasCriticasNoResueltas}
        </span>
      </div>

      {/* 8. Tasa Rotación */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <TrendingUp className="h-3 w-3 text-teal-500" />
          <span>Rotación Mes</span>
        </div>
        <span className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {kpis.tasaRotacionMensualPct}%
        </span>
      </div>
    </div>
  );
}
