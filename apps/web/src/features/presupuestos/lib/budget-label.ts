import type { AnnualBudget, BudgetSummaryRow } from '@sgia/types';

import { formatCLP } from '@/features/compras/lib/format';

/** Nombre de la carrera con su código cuando existe: `ISD · Ingeniería en Informática`. */
export function careerLabel(
  budget: Pick<AnnualBudget | BudgetSummaryRow, 'career' | 'career_id'>,
): string {
  const career = budget.career;
  if (!career) return `Carrera #${budget.career_id}`;
  return career.code ? `${career.code} · ${career.name}` : career.name;
}

/** Etiqueta de un presupuesto para selectores: carrera, año y disponible. */
export function budgetOptionLabel(budget: AnnualBudget): string {
  return `${careerLabel(budget)} · ${budget.year} — disponible ${formatCLP(budget.available_amount)}`;
}
