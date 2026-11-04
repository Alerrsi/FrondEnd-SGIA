import { useBudgets } from '@sgia/api-client';
import type { AnnualBudget } from '@sgia/types';
import type { SelectHTMLAttributes } from 'react';

import { budgetOptionLabel } from '@/features/presupuestos/lib/budget-label';
import { cn } from '@/lib/cn';

interface BudgetSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> {
  value: number | undefined;
  onChange: (budgetId: number | undefined, budget: AnnualBudget | undefined) => void;
  /** Por defecto se listan todos los años; AD-01 y DIR-01 ven todas las carreras. */
  year?: number;
  invalid?: boolean;
}

/** Selector de presupuesto anual con su disponible. */
export function BudgetSelect({
  value,
  onChange,
  year,
  invalid,
  className,
  ...props
}: BudgetSelectProps) {
  const { data, isLoading } = useBudgets({ year, per_page: 100 });
  const budgets = data?.data ?? [];

  return (
    <select
      {...props}
      value={value ?? ''}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        const id = e.target.value ? Number(e.target.value) : undefined;
        onChange(
          id,
          budgets.find((b) => b.id === id),
        );
      }}
      className={cn(className, invalid && 'border-rose-400 dark:border-rose-700')}
    >
      <option value="">
        {isLoading ? 'Cargando presupuestos…' : 'Selecciona un presupuesto…'}
      </option>
      {budgets.map((b) => (
        <option key={b.id} value={b.id}>
          {budgetOptionLabel(b)}
        </option>
      ))}
    </select>
  );
}
