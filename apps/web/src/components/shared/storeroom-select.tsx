import { useStorerooms } from '@sgia/api-client';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface StoreroomSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> {
  value: number | undefined;
  onChange: (storeroomId: number | undefined) => void;
  /** Texto de la opción vacía; por defecto «Todos los pañoles». */
  placeholder?: string;
  invalid?: boolean;
}

/** Selector de pañol (`GET /api/storerooms`). */
export function StoreroomSelect({
  value,
  onChange,
  placeholder = 'Todos los pañoles',
  invalid,
  className,
  ...props
}: StoreroomSelectProps) {
  const { data, isLoading } = useStorerooms({ per_page: 100 });
  const storerooms = data?.data ?? [];

  return (
    <select
      {...props}
      value={value ?? ''}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className={cn(className, invalid && 'border-rose-400')}
    >
      <option value="">{isLoading ? 'Cargando pañoles…' : placeholder}</option>
      {storerooms.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
