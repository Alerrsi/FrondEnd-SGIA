import { useCareers } from '@sgia/api-client';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface CareerSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> {
  value: number | undefined;
  onChange: (careerId: number | undefined) => void;
  /** Texto de la opción vacía; por defecto «Selecciona una carrera…». */
  placeholder?: string;
  invalid?: boolean;
}

/** Selector de carrera (`GET /api/careers`). */
export function CareerSelect({
  value,
  onChange,
  placeholder = 'Selecciona una carrera…',
  invalid,
  className,
  ...props
}: CareerSelectProps) {
  const { data, isLoading } = useCareers({ per_page: 100 });
  const careers = data?.data ?? [];

  return (
    <select
      {...props}
      value={value ?? ''}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className={cn(className, invalid && 'border-rose-400 dark:border-rose-700')}
    >
      <option value="">{isLoading ? 'Cargando carreras…' : placeholder}</option>
      {careers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
          {c.code ? ` (${c.code})` : ''}
        </option>
      ))}
    </select>
  );
}
