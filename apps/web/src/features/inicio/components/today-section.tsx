import { CellGrid } from '@/components/ui/cell-grid';
import { PurchaseFlowSteps } from '@/features/compras/components/purchase-flow-steps';
import { CriticalStockTask } from './critical-stock-task';
import { FailedLoginsTask } from './failed-logins-task';
import { LoanQueueTask } from './loan-queue-task';
import { MyLoanRequestsTasks } from './my-loan-requests-tasks';
import { OverdueLoansTask } from './overdue-loans-task';
import { SystemHealthTask } from './system-health-task';

const SUBTITLE = 'text-[13px] font-medium text-zinc-500 dark:text-zinc-400';

/** «Lo que te toca hoy»: pendientes reales del rol en celdas, cada una enlazada a donde se atiende. */
export function TodaySection({ role }: { role: string }) {
  if (role === 'DIR-01') {
    return (
      <div className="flex flex-col gap-3">
        <p className={SUBTITLE}>Compras en curso</p>
        <PurchaseFlowSteps />
        <p className={SUBTITLE}>Pañol</p>
        <CellGrid columns={2}>
          <CriticalStockTask description="Productos para incluir en una solicitud de compra." />
          <OverdueLoansTask to="/prestamos/historial" />
        </CellGrid>
      </div>
    );
  }

  if (role === 'PAN-01') {
    return (
      <CellGrid columns={3}>
        <LoanQueueTask />
        <OverdueLoansTask to="/prestamos/historial" />
        <CriticalStockTask description="Avisa al director para reponerlos." />
      </CellGrid>
    );
  }

  if (role === 'AD-01') {
    return (
      <CellGrid columns={2}>
        <SystemHealthTask />
        <FailedLoginsTask />
      </CellGrid>
    );
  }

  return (
    <CellGrid columns={3}>
      <MyLoanRequestsTasks />
    </CellGrid>
  );
}
