import * as Tabs from '@radix-ui/react-tabs';
import type { BudgetSummaryRow } from '@sgia/types';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatCLP } from '@/features/compras/lib/format';
import { BudgetExecutionBar } from '@/features/presupuestos/components/budget-execution-bar';
import { BudgetIntakesPanel } from '@/features/presupuestos/components/budget-intakes-panel';
import { BudgetMonthlyChart } from '@/features/presupuestos/components/budget-monthly-chart';
import { BudgetMovementsPanel } from '@/features/presupuestos/components/budget-movements-panel';
import { BudgetSpendingPanel } from '@/features/presupuestos/components/budget-spending-panel';
import { careerLabel } from '@/features/presupuestos/lib/budget-label';

const TABS = [
  { value: 'movements', label: 'Movimientos' },
  { value: 'spending', label: 'Gasto' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'intakes', label: 'Facturas' },
] as const;

interface BudgetDetailSheetProps {
  budget: BudgetSummaryRow | null;
  onClose: () => void;
}

export function BudgetDetailSheet({ budget, onClose }: BudgetDetailSheetProps) {
  return (
    <Sheet open={budget !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {budget && (
          <>
            <SheetHeader>
              <SheetTitle className="text-zinc-900 dark:text-zinc-100">
                {careerLabel(budget)} · <span className="font-mono">{budget.year}</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Disponible = inicial − consumido − reservado. Valores calculados por el servidor.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs">
              {(
                [
                  ['Inicial', budget.initial_amount],
                  ['Reservado', budget.reserved_amount],
                  ['Consumido', budget.consumed_amount],
                  ['Disponible', budget.available_amount],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                  <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCLP(value)}
                  </span>
                </div>
              ))}
              <BudgetExecutionBar
                className="ml-auto"
                initial={budget.initial_amount}
                consumed={budget.consumed_amount}
                reserved={budget.reserved_amount}
                percent={budget.execution_percent}
              />
            </div>

            <Tabs.Root defaultValue="movements" className="mt-4 flex flex-col gap-3">
              <Tabs.List
                aria-label="Detalle del presupuesto"
                className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800"
              >
                {TABS.map((tab) => (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    className="-mb-px border-b-2 border-transparent px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100"
                  >
                    {tab.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              <Tabs.Content value="movements">
                <BudgetMovementsPanel budgetId={budget.id} />
              </Tabs.Content>
              <Tabs.Content value="spending">
                <BudgetSpendingPanel budgetId={budget.id} />
              </Tabs.Content>
              <Tabs.Content value="monthly">
                <BudgetMonthlyChart budgetId={budget.id} year={budget.year} />
              </Tabs.Content>
              <Tabs.Content value="intakes">
                <BudgetIntakesPanel budgetId={budget.id} />
              </Tabs.Content>
            </Tabs.Root>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
