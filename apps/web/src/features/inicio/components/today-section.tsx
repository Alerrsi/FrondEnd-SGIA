import { PurchaseFlowSteps } from '@/features/compras/components/purchase-flow-steps';
import { CriticalStockTask } from './critical-stock-task';
import { FailedLoginsTask } from './failed-logins-task';
import { LoanQueueTask } from './loan-queue-task';
import { MyLoanRequestsTasks } from './my-loan-requests-tasks';
import { OverdueLoansTask } from './overdue-loans-task';
import { RecentActivity } from './recent-activity';
import { SystemHealthTask } from './system-health-task';

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';
const SUBTITLE = 'text-xs font-semibold text-zinc-500 dark:text-zinc-400';

/** «Lo que te toca hoy»: pendientes reales del rol, cada uno enlazado a la pantalla donde se atiende. */
export function TodaySection({ role }: { role: string }) {
  if (role === 'DIR-01') {
    return (
      <div className="flex flex-col gap-3">
        <p className={SUBTITLE}>Compras en curso</p>
        <PurchaseFlowSteps />
        <p className={SUBTITLE}>Pañol</p>
        <div className={GRID}>
          <CriticalStockTask description="Productos para incluir en una solicitud de compra." />
          <OverdueLoansTask to="/prestamos/historial" />
        </div>
      </div>
    );
  }

  if (role === 'PAN-01') {
    return (
      <div className={GRID}>
        <LoanQueueTask />
        <OverdueLoansTask to="/prestamos/historial" />
        <CriticalStockTask description="Avisa al director para reponerlos." />
      </div>
    );
  }

  if (role === 'AD-01') {
    return (
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <SystemHealthTask />
          <FailedLoginsTask />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>
    );
  }

  return (
    <div className={GRID}>
      <MyLoanRequestsTasks />
    </div>
  );
}
