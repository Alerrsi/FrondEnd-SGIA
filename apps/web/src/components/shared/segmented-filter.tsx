import { cn } from '@/lib/cn';

export interface SegmentedFilterOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegmentedFilterProps<T extends string | number> {
  options: ReadonlyArray<SegmentedFilterOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Nombre del grupo («Filtrar por estado»). */
  label: string;
  className?: string;
}

/**
 * Filtro de opciones excluyentes (estado, año, ventana de tiempo) como un grupo de segmentos neutros.
 * No usa el botón relleno: la acción principal de la vista sigue siendo la única `primary`.
 */
export function SegmentedFilter<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedFilterProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex max-w-full flex-wrap gap-0.5 rounded-full border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-7 cursor-pointer items-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 pointer-coarse:h-10',
              active
                ? 'bg-white text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
