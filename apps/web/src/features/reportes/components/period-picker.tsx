import { useId } from 'react';

import { SegmentedFilter } from '@/components/shared/segmented-filter';
import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

import {
  MONTH_NAMES,
  formatPeriodRange,
  periodRange,
  semesterRange,
  type PeriodMode,
  type PeriodRange,
  type PeriodValue,
} from '../lib/period';

const MODES: ReadonlyArray<{ value: PeriodMode; label: string }> = [
  { value: 'year', label: 'Año' },
  { value: 'semester', label: 'Semestre' },
  { value: 'month', label: 'Mes' },
  { value: 'range', label: 'Rango' },
  { value: 'last30', label: 'Últimos 30 días' },
];

/** Años elegibles: el actual y los cinco anteriores. */
function yearOptions(today: Date): number[] {
  const current = today.getFullYear();
  return Array.from({ length: 6 }, (_, i) => current - i);
}

export interface PeriodPickerProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  /** Fecha de hoy (pruebas). */
  today?: Date;
  /** Etiqueta del grupo; por defecto «Período». */
  label?: string;
  className?: string;
}

/**
 * Selector de período (docs/centro-reportes.md, decisión 7): año, semestre, mes, rango o últimos 30 días.
 * Muestra las fechas exactas que se envían como `from`/`to`.
 */
export function PeriodPicker({ value, onChange, today = new Date(), label = 'Período', className }: PeriodPickerProps) {
  const id = useId();
  const range: PeriodRange | null = periodRange(value, today);
  const years = yearOptions(today);
  if (!years.includes(value.year)) years.push(value.year);

  const changeMode = (mode: PeriodMode) => {
    if (mode === 'range') {
      // Al pasar a rango se parte de las fechas que se estaban viendo.
      const current = periodRange(value, today) ?? semesterRange(value.year, value.semester);
      onChange({ ...value, mode, from: current.from, to: current.to });
      return;
    }
    onChange({ ...value, mode });
  };

  const showYear = value.mode === 'year' || value.mode === 'semester' || value.mode === 'month';

  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2', className)}>
      <legend className={cn(FIELD_LABEL_CLASS, 'mb-1.5')}>{label}</legend>
      <SegmentedFilter options={MODES} value={value.mode} onChange={changeMode} label="Tipo de período" />
      <div className="flex flex-wrap items-center gap-2">
        {showYear && (
          <select
            aria-label="Año"
            value={value.year}
            onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
            className={FILTER_CONTROL_CLASS}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
        {value.mode === 'semester' && (
          <select
            aria-label="Semestre"
            value={value.semester}
            onChange={(e) => onChange({ ...value, semester: e.target.value === '2' ? 2 : 1 })}
            className={FILTER_CONTROL_CLASS}
          >
            <option value={1}>1.er semestre (ene–jun)</option>
            <option value={2}>2.º semestre (jul–dic)</option>
          </select>
        )}
        {value.mode === 'month' && (
          <select
            aria-label="Mes"
            value={value.month}
            onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
            className={FILTER_CONTROL_CLASS}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        )}
        {value.mode === 'range' && (
          <>
            <label htmlFor={`${id}-from`} className="sr-only">
              Desde
            </label>
            <input
              id={`${id}-from`}
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className={FILTER_CONTROL_CLASS}
            />
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">a</span>
            <label htmlFor={`${id}-to`} className="sr-only">
              Hasta
            </label>
            <input
              id={`${id}-to`}
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className={FILTER_CONTROL_CLASS}
            />
          </>
        )}
      </div>
      <p aria-live="polite" className="font-mono text-[13px] text-zinc-700 dark:text-zinc-300" data-testid="period-range">
        {range ? formatPeriodRange(range) : <span className="text-danger">Rango incompleto</span>}
      </p>
    </fieldset>
  );
}
