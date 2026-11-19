import { usePendingLoans } from '@sgia/api-client';
import { ArrowRight, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { loanSchedule, loanSubject, loanTeacher } from '@/features/prestamos/lib/loan-display';

/** Las próximas solicitudes de la cola del pañol, para revisar sin abrir otra pantalla primero. */
export function QueuePreview() {
  const { data, isLoading, isError } = usePendingLoans({ per_page: 5 });
  const loans = data?.data ?? [];

  return (
    <section aria-label="Próximas solicitudes" className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <SectionTitle icon={Inbox} as="h2">Próximas solicitudes</SectionTitle>
        <Link to="/prestamos/cola" className="group inline-flex items-center gap-1 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          Ver la cola
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-[3px]" />
        </Link>
      </div>
      {isLoading ? (
        <SkeletonList label="Cargando la cola…" rows={4} columns={2} />
      ) : isError ? (
        <EmptyState title="No se pudo cargar la cola" description="Abre la cola para reintentar." />
      ) : loans.length === 0 ? (
        <EmptyState icon={Inbox} title="Sin solicitudes en cola" description="Cuando un docente pida equipos, aparecerán aquí." />
      ) : (
        <ul>
          {loans.map((loan) => (
            <li key={loan.id} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
              <Link
                to="/prestamos/cola"
                className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{loanTeacher(loan)}</span>
                  <span className="truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                    {loanSubject(loan)} · {loanSchedule(loan)}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] text-zinc-500 tabular-nums dark:text-zinc-400">
                  {loan.items.length} {loan.items.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
