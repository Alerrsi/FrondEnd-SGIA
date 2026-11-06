import { PageEyebrow } from '@/components/shared/page-eyebrow';
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
      <div className="flex flex-col gap-1 border-b border-border pb-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
          <PageEyebrow area="PAÑOL TI" section="Préstamos" />
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <CalendarClock aria-hidden="true" className="h-5 w-5 text-text" />
              Centro Operativo de Préstamos
            </h1>
            <p className="text-xs text-text-muted">
              Selecciona el módulo de atención para despachos remotos, mesón presencial o auditoría histórica.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Accesos Directos Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Mostrador Presencial */}
        <Card
          className="flex flex-col justify-between p-5 hover:border-text-muted transition cursor-pointer group"
          onClick={() => navigate('/prestamos/mostrador')}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised text-text group-hover:scale-105 transition-transform">
                <ScanLine aria-hidden="true" className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-ok/30">
                Lector Code128
              </span>
            </div>

            <div>
              <h2 className="text-sm font-bold text-text group-hover:text-brand-strong transition-colors">
                Mostrador y Devoluciones
              </h2>
              <p className="mt-1 text-xs text-text-muted leading-relaxed">
                Entrega presencial directa con escáner de credencial y códigos de barra, más recepción de materiales.
              </p>
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-text-muted">
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
              <span>Préstamos en curso: <strong>{activeCount}</strong></span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-semibold text-text">Ir al Mostrador</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-text-muted group-hover:translate-x-1 group-hover:text-text transition" />
          </div>
        </Card>

        {/* 2. Cola Remota */}
        <Card
          className="flex flex-col justify-between p-5 hover:border-text-muted transition cursor-pointer group"
          onClick={() => navigate('/prestamos/cola')}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised text-text group-hover:scale-105 transition-transform">
                <Clock aria-hidden="true" className="h-5 w-5" />
              </div>
              {pendingCount > 0 ? (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-warn/30">
                  {pendingCount} Pendientes
                </span>
              ) : (
                <span className="font-mono text-xs text-text-muted">Al día</span>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-text group-hover:text-brand-strong transition-colors">
                Cola de Solicitudes Remotas
              </h2>
              <p className="mt-1 text-xs text-text-muted leading-relaxed">
                Bandeja de pedidos enviados por docentes desde la app móvil. Preparación anticipada y aprobación.
              </p>
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-text-muted">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
              <span>Despachos listos para entrega</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-semibold text-text">Ver Cola de Despacho</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-text-muted group-hover:translate-x-1 group-hover:text-text transition" />
          </div>
        </Card>

        {/* 3. Historial y Auditoría */}
        <Card
          className="flex flex-col justify-between p-5 hover:border-text-muted transition cursor-pointer group"
          onClick={() => navigate('/prestamos/historial')}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised text-text group-hover:scale-105 transition-transform">
                <History aria-hidden="true" className="h-5 w-5" />
              </div>
              {overdueCount > 0 && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-danger-bg text-danger border border-danger/30 flex items-center gap-1">
                  <AlertTriangle aria-hidden="true" className="h-3 w-3" />
                  {overdueCount} Atrasados
                </span>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-text group-hover:text-brand-strong transition-colors">
                Historial y Auditoría
              </h2>
              <p className="mt-1 text-xs text-text-muted leading-relaxed">
                Trazabilidad completa, bitácora de eventos, reportes en PDF y Excel para fin de semestre.
              </p>
            </div>

            <div className="mt-2 flex items-center gap-2 font-mono text-xs text-text-muted">
              <History aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
              <span>Bitácora histórica del pañol</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-semibold text-text">Consultar Historial</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-text-muted group-hover:translate-x-1 group-hover:text-text transition" />
          </div>
        </Card>
      </div>
    </div>
  );
}
