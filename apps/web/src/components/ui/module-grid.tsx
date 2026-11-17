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
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {links.map(({ to, label, description, icon: Icon }) => (
        <li key={to}>
          <Link
            to={to}
            className="group flex h-full items-start gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2.5 shadow-xs transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{description}</span>
            </span>
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
