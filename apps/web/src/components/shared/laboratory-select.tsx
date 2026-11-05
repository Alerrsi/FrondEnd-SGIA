import { useLocations } from '@sgia/api-client';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface LaboratorySelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> {
  value: number | undefined;
  onChange: (locationId: number | undefined) => void;
  /** Solo los laboratorios de ese pañol. */
  storeroomId?: number;
  /** Texto de la opción vacía; por defecto «Todos los laboratorios». */
  placeholder?: string;
}

/** Selector de laboratorio: salas y talleres (`GET /api/locations`), opcionalmente de un pañol. */
export function LaboratorySelect({
  value,
  onChange,
  storeroomId,
  placeholder = 'Todos los laboratorios',
  className,
  ...props
}: LaboratorySelectProps) {
  const { data, isLoading } = useLocations({
    storeroom_id: storeroomId,
    per_page: 100,
  });
  const laboratories = (data?.data ?? []).filter((l) => l.tipo === 'sala' || l.tipo === 'taller');

  return (
    <select
      {...props}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className={cn(className)}
    >
      <option value="">{isLoading ? 'Cargando laboratorios…' : placeholder}</option>
      {laboratories.map((l) => (
        <option key={l.id} value={l.id}>
          {l.nombre}
        </option>
      ))}
    </select>
  );
}
