import { Loader2, Search } from 'lucide-react';

import { FILTER_CONTROL_CLASS } from '@/components/ui/form-control';
import { cn } from '@/lib/cn';
import { plural } from '../lib/map-labels';

export interface SalaSearchProps {
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  matches: number;
  isSearching: boolean;
}

/** «Buscar en la sala»: marca con un punto burdeo los estantes que tienen lo buscado. */
export function SalaSearch({ value, onChange, active, matches, isSearching }: SalaSearchProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <label className="relative flex w-full min-w-0 items-center sm:w-64">
        <span className="sr-only">Buscar en la sala</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar estante, cajón o producto"
          className={cn(FILTER_CONTROL_CLASS, 'w-full pl-8')}
        />
      </label>
      <span aria-live="polite" className="flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
        {isSearching && <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />}
        {active && !isSearching && (matches > 0 ? `${plural(matches, 'estante', 'estantes')} con coincidencias` : 'Sin coincidencias en esta sala')}
      </span>
    </div>
  );
}
