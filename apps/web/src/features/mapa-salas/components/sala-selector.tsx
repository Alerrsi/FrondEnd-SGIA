import type { LocationEntity } from '@sgia/types';

import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { cn } from '@/lib/cn';

export interface SalaSelectorProps {
  salas: LocationEntity[];
  value: number;
  onChange: (locationId: number) => void;
  className?: string;
}

/** Cambia de sala sin recargar la página. */
export function SalaSelector({ salas, value, onChange, className }: SalaSelectorProps) {
  return (
    <label className={cn('flex min-w-0 items-center gap-2', className)}>
      <span className="sr-only">Sala</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(FILTER_CONTROL_CLASS, 'w-full min-w-0 sm:w-64')}
      >
        {salas.map((sala) => (
          <option key={sala.id} value={sala.id}>
            {sala.code ? `${sala.code} · ${sala.nombre}` : sala.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
