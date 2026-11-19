import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { findScreen } from './nav-config';

/** Ruta actual: Inicio / grupo / pantalla (/ detalle). Ayuda a ubicarse y volver un nivel con un clic. */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const match = findScreen(pathname);
  const crumbs: Array<{ label: string; to?: string }> = [];

  if (pathname !== '/') crumbs.push({ label: 'Inicio', to: '/' });
  if (match?.group) crumbs.push({ label: match.group.label, to: match.group.to });
  if (match && match.entry.to !== '/') {
    const isDetail = pathname !== match.entry.to;
    crumbs.push({ label: match.entry.label, to: isDetail ? match.entry.to : undefined });
    if (isDetail) crumbs.push({ label: 'Detalle' });
  } else if (pathname === '/') {
    crumbs.push({ label: 'Inicio' });
  }

  return (
    <nav aria-label="Ruta" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-[13px]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className={last ? 'flex min-w-0 items-center gap-1' : 'hidden items-center gap-1 sm:flex'}>
              {c.to && !last ? (
                <Link to={c.to} className="truncate text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
