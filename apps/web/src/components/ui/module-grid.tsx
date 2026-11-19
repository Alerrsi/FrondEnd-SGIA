import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ModuleGridLink {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Grilla de accesos a módulos: icono, nombre y una línea de descripción. */
export function ModuleGrid({ links }: { links: ModuleGridLink[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {links.map(({ to, label, description, icon: Icon }) => (
        <li key={to}>
          <Link
            to={to}
            className="group flex h-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-tag group-hover:text-tag-ink dark:bg-zinc-800 dark:text-zinc-300">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
            </span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
