import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Clock,
  ScanLine,
  History,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLoans } from '@sgia/api-client';
import { LoanStatus } from '@sgia/types';

export default function PrestamosMenuPage() {
  const navigate = useNavigate();

  // Métricas rápidas para las tarjetas
  const { data: pendingLoans } = useLoans({ estado: LoanStatus.PENDIENTE, per_page: 1 });
  const { data: activeLoans } = useLoans({ estado: LoanStatus.ACTIVO, per_page: 1 });
  const { data: overdueLoans } = useLoans({ estado: LoanStatus.ATRASADO, per_page: 1 });

  const pendingCount = pendingLoans?.meta?.total ?? 0;
  const activeCount = activeLoans?.meta?.total ?? 0;
  const overdueCount = overdueLoans?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-zinc-400 text-xs font-mono">/</span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Gestión y Control de Préstamos
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Centro Operativo de Préstamos
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Selecciona el módulo de atención para despachos remotos, mesón presencial o auditoría histórica.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Accesos Directos Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Mostrador Presencial */}
        <Card
          className="flex flex-col justify-between p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer group"
          onClick={() => navigate('/prestamos/mostrador')}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:scale-105 transition-transform">
                <ScanLine className="h-5 w-5" />
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                Lector Code128
              </span>
            </div>

            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                Mostrador y Devoluciones
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Entrega presencial directa con escáner de credencial y códigos de barra, más recepción de materiales.
              </p>
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              <span>Préstamos en curso: <strong>{activeCount}</strong></span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Ir al Mostrador</span>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all" />
          </div>
        </Card>

        {/* 2. Cola Remota */}
        <Card
          className="flex flex-col justify-between p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer group"
          onClick={() => navigate('/prestamos/cola')}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:scale-105 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
              {pendingCount > 0 ? (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                  {pendingCount} Pendientes
                </span>
              ) : (
                <span className="font-mono text-[11px] text-zinc-400">Al día</span>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                Cola de Solicitudes Remotas
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Bandeja de pedidos enviados por docentes desde la app móvil. Preparación anticipada y aprobación.
              </p>
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
              <span>Despachos listos para entrega</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Ver Cola de Despacho</span>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all" />
          </div>
        </Card>

        {/* 3. Historial y Auditoría */}
        <Card
          className="flex flex-col justify-between p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer group"
          onClick={() => navigate('/prestamos/historial')}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 group-hover:scale-105 transition-transform">
                <History className="h-5 w-5" />
              </div>
              {overdueCount > 0 && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueCount} Atrasados
                </span>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                Historial y Auditoría
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Trazabilidad completa, bitácora de eventos, reportes en PDF y Excel para fin de semestre.
              </p>
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <History className="h-3.5 w-3.5 text-zinc-400" />
              <span>Bitácora histórica del pañol</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Consultar Historial</span>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all" />
          </div>
        </Card>
      </div>
    </div>
  );
}
