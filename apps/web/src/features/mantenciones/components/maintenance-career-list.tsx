import type { MaintenanceCareerSummary } from '@sgia/types';

import { CODE_CHIP_CLASS } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { careerFilterOf, type CareerFilter } from '../lib/career-filter';

const nf = new Intl.NumberFormat('es-CL');

/** Solo neutros y burdeo (docs/mantenciones-por-carrera.md, decisión 8). */
const SEGMENTS = [
  { key: 'en_curso', label: 'En curso', className: 'bg-accent' },
  { key: 'finalizada', label: 'Finalizadas', className: 'bg-zinc-400 dark:bg-zinc-500' },
  { key: 'anulada', label: 'Anuladas', className: 'bg-zinc-300 dark:bg-zinc-700' },
] as const;

const ROW_CLASS =
  'relative flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent pointer-coarse:py-3';
const SELECTED_CLASS = 'bg-accent-soft before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent';

export interface MaintenanceCareerListProps {
  careers: MaintenanceCareerSummary[];
  /** Total de mantenciones (fila «Todas las carreras»). */
  total: number;
  selected: CareerFilter;
  onSelect: (filter: CareerFilter) => void;
  className?: string;
}

/**
 * Mantenciones por carrera en filas compactas (docs/mantenciones-por-carrera.md, decisiones 8–10): código, nombre y
 * total; debajo una barra delgada por estado (largo proporcional a la carrera con más mantenciones) y cuántas
 * siguen en curso. Elegir una fila filtra la bandeja; «Todas las carreras» lo quita.
 */
export function MaintenanceCareerList({ careers, total, selected, onSelect, className }: MaintenanceCareerListProps) {
  const max = Math.max(1, ...careers.map((c) => c.total));
  const ordered = [...careers.filter((c) => c.total > 0), ...careers.filter((c) => c.total === 0)];

  return (
    <section
      aria-labelledby="mantenciones-por-carrera"
      className={cn('flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900', className)}
    >
      <div className="flex flex-col gap-1.5 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
        <h2 id="mantenciones-por-carrera" className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
          Por carrera
        </h2>
        <ul aria-label="Leyenda" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {SEGMENTS.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn('h-2 w-2 rounded-sm', s.className)} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      <ul aria-label="Carreras" className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <li>
          <button
            type="button"
            aria-pressed={selected === null}
            onClick={() => onSelect(null)}
            className={cn(ROW_CLASS, 'flex-row items-center justify-between', selected === null ? SELECTED_CLASS : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40')}
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Todas las carreras</span>
            <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{nf.format(total)}</span>
          </button>
        </li>
        {ordered.map((career) => {
          const filter = careerFilterOf(career);
          const isSelected = selected === filter;
          const empty = career.total === 0;
          const enCurso = career.by_status.en_curso;
          return (
            <li key={career.career_id ?? 'none'}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(isSelected ? null : filter)}
                title={career.name}
                className={cn(ROW_CLASS, isSelected ? SELECTED_CLASS : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40')}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {career.code && <span className={cn(CODE_CHIP_CLASS, 'shrink-0')}>{career.code}</span>}
                  <span className={cn('min-w-0 flex-1 truncate text-sm', empty ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100')}>
                    {career.name}
                  </span>
                  <span className={cn('shrink-0 font-mono text-sm', empty ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100')}>
                    {nf.format(career.total)}
                  </span>
                </span>
                {!empty && (
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
                    <span className={cn('shrink-0 text-xs', enCurso > 0 ? 'font-medium text-accent' : 'text-zinc-500 dark:text-zinc-400')}>
                      {enCurso > 0 ? `${nf.format(enCurso)} en curso` : 'Al día'}
                    </span>
                  </span>
                )}
                <span className="sr-only">
                  {`: ${nf.format(career.by_status.en_curso)} en curso, ${nf.format(career.by_status.finalizada)} finalizadas, ${nf.format(career.by_status.anulada)} anuladas, ${nf.format(career.units)} unidades`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
