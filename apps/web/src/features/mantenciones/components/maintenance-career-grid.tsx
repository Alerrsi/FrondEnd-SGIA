import type { MaintenanceCareerSummary } from '@sgia/types';

import { CellGrid } from '@/components/ui/cell-grid';
import { CODE_CHIP_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { careerFilterOf, type CareerFilter } from '../lib/career-filter';

const nf = new Intl.NumberFormat('es-CL');

const SEGMENTS = [
  { key: 'en_curso', label: 'En curso', className: 'bg-warn' },
  { key: 'finalizada', label: 'Finalizadas', className: 'bg-ok' },
  { key: 'anulada', label: 'Anuladas', className: 'bg-zinc-400 dark:bg-zinc-500' },
] as const;

function plural(n: number, one: string, many: string): string {
  return `${nf.format(n)} ${n === 1 ? one : many}`;
}

export interface MaintenanceCareerGridProps {
  careers: MaintenanceCareerSummary[];
  selected: CareerFilter;
  /** Tocar una carrera la elige para filtrar la bandeja; tocarla de nuevo quita el filtro. */
  onToggle: (filter: Exclude<CareerFilter, null>) => void;
}

/**
 * Mantenciones por carrera (docs/mantenciones-por-carrera.md, decisiones 3 y 4): una celda por carrera con su total,
 * una barra apilada por estado (largo proporcional a la carrera con más mantenciones) y el desglose en texto.
 * Cada celda es un botón que filtra la bandeja.
 */
export function MaintenanceCareerGrid({ careers, selected, onToggle }: MaintenanceCareerGridProps) {
  const withRecords = careers.filter((c) => c.total > 0);
  const empty = careers.filter((c) => c.total === 0);
  const max = Math.max(1, ...withRecords.map((c) => c.total));

  return (
    <section aria-labelledby="mantenciones-por-carrera" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-0.5">
          <h2 id="mantenciones-por-carrera" className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
            Mantenciones por carrera
          </h2>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Toca una carrera para ver solo sus mantenciones en la bandeja.</p>
        </div>
        <ul aria-label="Leyenda" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-zinc-600 dark:text-zinc-300">
          {SEGMENTS.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-sm', s.className)} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      {withRecords.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-center text-[13px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Aún no hay mantenciones registradas.
        </p>
      ) : (
        <CellGrid as="ul" columns={4} aria-label="Carreras">
          {withRecords.map((career) => {
            const filter = careerFilterOf(career);
            const isSelected = selected === filter;
            const { en_curso, finalizada, anulada } = career.by_status;
            const parts: Array<{ key: string; text: string; className?: string }> = [
              ...(en_curso > 0 ? [{ key: 'en_curso', text: `${nf.format(en_curso)} en curso`, className: 'font-medium text-warn' }] : []),
              ...(finalizada > 0 ? [{ key: 'finalizada', text: plural(finalizada, 'finalizada', 'finalizadas') }] : []),
              ...(anulada > 0 ? [{ key: 'anulada', text: plural(anulada, 'anulada', 'anuladas') }] : []),
              { key: 'units', text: plural(career.units, 'unidad', 'unidades'), className: 'text-zinc-500 dark:text-zinc-400' },
            ];
            return (
              <li key={career.career_id ?? 'none'} className="flex">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggle(filter)}
                  className={cn(
                    'relative flex w-full min-w-0 flex-col gap-3 p-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                    isSelected
                      ? 'bg-accent-soft before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-accent'
                      : 'bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50',
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 flex-col gap-1">
                      {career.code && <span className={cn(CODE_CHIP_CLASS, 'self-start')}>{career.code}</span>}
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{career.name}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="text-2xl leading-8 font-medium tracking-[-0.02em] tabular-nums text-zinc-900 dark:text-zinc-100">
                        {nf.format(career.total)}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{career.total === 1 ? 'mantención' : 'mantenciones'}</span>
                    </span>
                  </span>

                  <span aria-hidden="true" className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    {SEGMENTS.map((s) =>
                      career.by_status[s.key] > 0 ? (
                        <span
                          key={s.key}
                          data-segment={s.key}
                          className={cn('h-full', s.className)}
                          style={{ width: `${(career.by_status[s.key] / max) * 100}%` }}
                        />
                      ) : null,
                    )}
                  </span>

                  <span className="flex flex-wrap gap-x-1.5 text-[13px] text-zinc-600 dark:text-zinc-300">
                    {parts.map((part, i) => (
                      <span key={part.key} className={part.className}>
                        {i > 0 && <span aria-hidden="true" className="text-zinc-400">· </span>}
                        {part.text}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </CellGrid>
      )}

      {empty.length > 0 && (
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
          Sin mantenciones: {empty.map((c) => c.code ?? c.name).join(', ')}
        </p>
      )}
    </section>
  );
}
