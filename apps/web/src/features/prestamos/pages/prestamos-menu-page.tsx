import { AlertTriangle, CalendarClock, Clock, History, RotateCcw, ScanLine, ShieldCheck } from 'lucide-react';
import { useLoans } from '@sgia/api-client';
import { LoanStatus } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { CellGrid } from '@/components/ui/cell-grid';
import { PageHeader } from '@/components/ui/page-header';
import { LoanHubCell } from '../components/loan-hub-cell';

export default function PrestamosMenuPage() {
  // Métricas rápidas para las tarjetas
  const { data: pendingLoans } = useLoans({ estado: LoanStatus.PENDIENTE, per_page: 1 });
  const { data: activeLoans } = useLoans({ estado: LoanStatus.ACTIVO, per_page: 1 });
  const { data: overdueLoans } = useLoans({ estado: LoanStatus.ATRASADO, per_page: 1 });

  const pendingCount = pendingLoans?.meta?.total ?? 0;
  const activeCount = activeLoans?.meta?.total ?? 0;
  const overdueCount = overdueLoans?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={CalendarClock}
        title="Centro operativo de préstamos"
        description="Elige dónde atender: el mostrador presencial, la cola de solicitudes de docentes o el historial."
      />

      <CellGrid columns={3} aria-label="Módulos de préstamos">
        <LoanHubCell
          to="/prestamos/mostrador"
          icon={ScanLine}
          status={<Badge tone="success">Lector Code128</Badge>}
          title="Mostrador y devoluciones"
          description="Entrega presencial directa con escáner de credencial y códigos de barra, más recepción de materiales."
          detailIcon={RotateCcw}
          detail={
            <>
              Préstamos en curso: <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{activeCount}</span>
            </>
          }
          cta="Ir al mostrador"
        />
        <LoanHubCell
          to="/prestamos/cola"
          icon={Clock}
          status={
            pendingCount > 0 ? (
              <Badge tone="warning">
                <span className="font-mono">{pendingCount}</span> pendientes
              </Badge>
            ) : (
              <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Al día</span>
            )
          }
          title="Cola de solicitudes remotas"
          description="Bandeja de pedidos enviados por docentes desde la app móvil. Preparación anticipada y aprobación."
          detailIcon={ShieldCheck}
          detail="Despachos listos para entrega"
          cta="Ver cola de despacho"
        />
        <LoanHubCell
          to="/prestamos/historial"
          icon={History}
          status={
            overdueCount > 0 ? (
              <Badge tone="danger" icon={<AlertTriangle aria-hidden="true" className="h-3 w-3" />}>
                <span className="font-mono">{overdueCount}</span> atrasados
              </Badge>
            ) : undefined
          }
          title="Historial y auditoría"
          description="Trazabilidad completa, bitácora de eventos, reportes en PDF y Excel para fin de semestre."
          detailIcon={History}
          detail="Bitácora histórica del pañol"
          cta="Consultar historial"
        />
      </CellGrid>
    </div>
  );
}
