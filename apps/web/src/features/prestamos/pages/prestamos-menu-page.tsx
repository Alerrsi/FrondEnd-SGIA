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
import { PageHeading } from '@/components/ui/page-heading';
import { SectionTitle } from '@/components/ui/section-title';
import { Badge } from '@/components/ui/badge';

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
    <div className="flex flex-col gap-4">
      {/* Encabezado */}
      <div className="flex flex-col gap-2">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeading icon={CalendarClock} title="Centro operativo de préstamos">
            Selecciona el módulo de atención para despachos remotos, mesón presencial o auditoría histórica.
          </PageHeading>
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
              <Badge tone="success" mono>Lector Code128</Badge>
            </div>

            <div>
              <SectionTitle className="group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">Mostrador y devoluciones</SectionTitle>
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
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Ir al mostrador</span>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all" />
          </div>
        </Card>

        {/* 2. Cola remota */}
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
                <Badge tone="warning" mono>{pendingCount} Pendientes</Badge>
              ) : (
                <span className="font-mono text-[11px] text-zinc-400">Al día</span>
              )}
            </div>

            <div>
              <SectionTitle className="group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">Cola de solicitudes remotas</SectionTitle>
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
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Ver cola de despacho</span>
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
                <Badge tone="danger" mono icon={<AlertTriangle className="h-3 w-3" />}>{overdueCount} Atrasados</Badge>
              )}
            </div>

            <div>
              <SectionTitle className="group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">Historial y auditoría</SectionTitle>
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
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Consultar historial</span>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all" />
          </div>
        </Card>
      </div>
    </div>
  );
}
