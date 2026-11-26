import { useId } from 'react';

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
 * Muestra las fechas exactas que se envían como `from`/`to`. Todo en selectores, del alto de los demás filtros.
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
  const control = cn(FILTER_CONTROL_CLASS, 'min-w-0');

  // Un bloque del mismo alto que los demás filtros: etiqueta con las fechas exactas a la derecha y, debajo,
  // los selectores en una sola línea (tipo de período, año y semestre o mes; o las dos fechas del rango).
  return (
    <div role="group" aria-labelledby={`${id}-label`} className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <span id={`${id}-label`} className={FIELD_LABEL_CLASS}>
          {label}
        </span>
        <span
          aria-live="polite"
          className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400"
          data-testid="period-range"
        >
          {range ? formatPeriodRange(range) : <span className="text-danger">Rango incompleto</span>}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <select
          aria-label="Tipo de período"
          value={value.mode}
          onChange={(e) => changeMode(e.target.value as PeriodMode)}
          className={cn(control, 'flex-1')}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        {showYear && (
          <select
            aria-label="Año"
            value={value.year}
            onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
            className={cn(control, 'w-[76px] shrink-0')}
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
            className={cn(control, 'flex-[1.3]')}
          >
            <option value={1}>1.er semestre</option>
            <option value={2}>2.º semestre</option>
          </select>
        )}
        {value.mode === 'month' && (
          <select
            aria-label="Mes"
            value={value.month}
            onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
            className={cn(control, 'flex-[1.3]')}
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
              className={cn(control, 'flex-1')}
            />
            <label htmlFor={`${id}-to`} className="sr-only">
              Hasta
            </label>
            <input
              id={`${id}-to`}
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className={cn(control, 'flex-1')}
            />
          </>
        )}
      </div>
    </div>
  );
}
