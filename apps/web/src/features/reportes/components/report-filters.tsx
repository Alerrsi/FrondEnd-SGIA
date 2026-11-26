import { useId } from 'react';

import { CareerSelect } from '@/components/shared/career-select';
import { StoreroomSelect } from '@/components/shared/storeroom-select';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

import type { ReportDefinition, ReportFilter } from '../catalog';
import type { PeriodValue } from '../lib/period';
import type { ReportFilterValues } from '../lib/report-params';
import { PeriodPicker } from './period-picker';

export interface ReportFiltersProps {
  report: ReportDefinition;
  values: ReportFilterValues;
  onChange: (id: string, value: string) => void;
  period: PeriodValue;
  onPeriodChange: (value: PeriodValue) => void;
  today?: Date;
}

const CONTROL = cn(FILTER_CONTROL_CLASS, 'w-full');

/** Años del filtro `year` (presupuestos): el próximo, el actual y los cuatro anteriores. */
function budgetYears(today: Date): number[] {
  const current = today.getFullYear();
  return Array.from({ length: 6 }, (_, i) => current + 1 - i);
}

/** Filtros declarados en el catálogo, cada uno con su control (decisión 3). */
export function ReportFilters({ report, values, onChange, period, onPeriodChange, today = new Date() }: ReportFiltersProps) {
  const baseId = useId();
  const periodFilter = report.filters.find((f) => f.type === 'period');
  const others = report.filters.filter(
    (f): f is Exclude<ReportFilter, { type: 'period' }> => f.type !== 'period',
  );

  const control = (filter: Exclude<ReportFilter, { type: 'period' }>) => {
    const id = `${baseId}-${filter.id}`;
    const value = values[filter.id] ?? '';
    let input;
    switch (filter.type) {
      case 'select':
        input = (
          <select id={id} value={value} onChange={(e) => onChange(filter.id, e.target.value)} className={CONTROL}>
            <option value="">{filter.placeholder}</option>
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
        break;
      case 'search':
        input = (
          <input
            id={id}
            type="search"
            value={value}
            placeholder={filter.placeholder}
            onChange={(e) => onChange(filter.id, e.target.value)}
            className={CONTROL}
            maxLength={120}
          />
        );
        break;
      case 'career':
        input = (
          <CareerSelect
            id={id}
            value={value ? Number(value) : undefined}
            onChange={(v) => onChange(filter.id, v === undefined ? '' : String(v))}
            placeholder="Todas las carreras"
            className={CONTROL}
          />
        );
        break;
      case 'storeroom':
        input = (
          <StoreroomSelect
            id={id}
            value={value ? Number(value) : undefined}
            onChange={(v) => onChange(filter.id, v === undefined ? '' : String(v))}
            className={CONTROL}
          />
        );
        break;
      case 'year':
        input = (
          <select id={id} value={value} onChange={(e) => onChange(filter.id, e.target.value)} className={CONTROL}>
            <option value="">Todos los años</option>
            {budgetYears(today).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        );
        break;
    }
    return (
      <div key={filter.id} className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor={id} className={FIELD_LABEL_CLASS}>
          {filter.label}
        </label>
        {input}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {periodFilter && (
        <PeriodPicker
          value={period}
          onChange={onPeriodChange}
          today={today}
          label={periodFilter.type === 'period' && periodFilter.required ? 'Período (obligatorio)' : 'Período'}
        />
      )}
      {others.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {others.map((f) => control(f))}
        </div>
      )}
    </div>
  );
}
