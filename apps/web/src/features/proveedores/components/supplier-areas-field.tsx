import { SUPPLIER_AREAS, SUPPLIER_AREA_LABELS, type SupplierArea } from '@sgia/types';
import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

interface SupplierAreasFieldProps {
  value: SupplierArea[];
  onChange: (areas: SupplierArea[]) => void;
  /** Por defecto, las 4 áreas fijas del contrato. */
  options?: readonly SupplierArea[];
  disabled?: boolean;
  invalid?: boolean;
  /** Texto accesible del grupo. */
  label: string;
  /** Detalle por área (p. ej. cuántos proveedores activos tiene). */
  hint?: (area: SupplierArea) => string | undefined;
}

/** Multiselección de áreas como chips con casilla. Mantiene el orden del enum. */
export function SupplierAreasField({
  value,
  onChange,
  options = SUPPLIER_AREAS,
  disabled,
  invalid,
  label,
  hint,
}: SupplierAreasFieldProps) {
  const toggle = (area: SupplierArea) => {
    const next = value.includes(area) ? value.filter((a) => a !== area) : [...value, area];
    onChange(options.filter((a) => next.includes(a)));
  };

  return (
    <div
      role="group"
      aria-label={label}
      aria-invalid={invalid || undefined}
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {options.map((area) => {
        const checked = value.includes(area);
        const detail = hint?.(area);
        return (
          <label
            key={area}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors',
              checked
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700',
              invalid && !checked && 'border-rose-300 dark:border-rose-800',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(area)}
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                checked
                  ? 'border-white dark:border-zinc-900'
                  : 'border-zinc-300 dark:border-zinc-600',
              )}
            >
              {checked && <Check className="h-3 w-3" />}
            </span>
            <span className="flex-1 font-medium">{SUPPLIER_AREA_LABELS[area]}</span>
            {detail && <span className="font-mono text-[11px] opacity-70">{detail}</span>}
          </label>
        );
      })}
    </div>
  );
}
