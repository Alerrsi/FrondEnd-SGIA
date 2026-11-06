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
        className="flex items-center rounded-lg border border-danger/30 bg-surface p-3 font-mono text-xs text-danger"
      >
        No se pudieron cargar los indicadores: {apiErrorToMessage(error)}
      </div>
    );
  }

  if (isLoading || !kpis) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 shadow-xs animate-pulse font-mono text-xs text-text-muted">
        <span>Cargando indicadores ejecutivos…</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-lg border border-border bg-surface font-mono shadow-xs overflow-hidden">
      {/* 1. Activos Disponibles */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wider">
          <CheckCircle2 aria-hidden="true" className="h-3 w-3 text-emerald-500" />
          <span>Disponibles</span>
        </div>
        <span className="mt-1 text-base font-bold text-text tabular-nums">
          {kpis.activosDisponibles}
        </span>
      </div>

      {/* 2. En Préstamo */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wider">
          <Boxes aria-hidden="true" className="h-3 w-3 text-blue-500" />
          <span>En Préstamo</span>
        </div>
        <span className="mt-1 text-base font-bold text-text tabular-nums">
          {kpis.activosEnPrestamo}
        </span>
      </div>

      {/* 3. En Taller / Mantención */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wider">
          <Wrench aria-hidden="true" className="h-3 w-3 text-amber-500" />
          <span>En Taller</span>
        </div>
        <span className="mt-1 text-base font-bold text-text tabular-nums">
          {kpis.activosEnTaller}
        </span>
      </div>

      {/* 4. De Baja */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wider">
          <AlertOctagon aria-hidden="true" className="h-3 w-3 text-text-muted" />
          <span>De Baja</span>
        </div>
        <span className="mt-1 text-base font-bold text-text tabular-nums">
          {kpis.activosDeBaja}
        </span>
      </div>

      {/* 5. Préstamos Hoy */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wider">
          <CalendarClock aria-hidden="true" className="h-3 w-3 text-indigo-500" />
          <span>Préstamos Hoy</span>
        </div>
        <span className="mt-1 text-base font-bold text-text tabular-nums">
          {kpis.prestamosActivosHoy}
        </span>
      </div>

      {/* 6. Tasa de Atrasos */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wider">
          <Percent aria-hidden="true" className="h-3 w-3 text-danger" />
          <span>Tasa Atrasos</span>
        </div>
        <span className="mt-1 text-base font-bold text-danger tabular-nums">
          {kpis.tasaAtrasosPct}%
        </span>
      </div>

      {/* 7. Alertas Críticas */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wider">
          <AlertOctagon aria-hidden="true" className="h-3 w-3 text-danger animate-pulse" />
          <span>Alertas Stock</span>
        </div>
        <span className="mt-1 text-base font-bold text-danger tabular-nums">
          {kpis.alertasCriticasNoResueltas}
        </span>
      </div>

      {/* 8. Tasa Rotación */}
      <div className="flex flex-col p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wider">
          <TrendingUp aria-hidden="true" className="h-3 w-3 text-teal-500" />
          <span>Rotación Mes</span>
        </div>
        <span className="mt-1 text-base font-bold text-text tabular-nums">
          {kpis.tasaRotacionMensualPct}%
        </span>
      </div>
    </div>
  );
}
