import { ArrowRight, type LucideIcon } from 'lucide-react';

import { Cell } from './cell';
import { CellGrid } from './cell-grid';

export interface ModuleGridLink {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Accesos a módulos: celdas enlazadas con icono, nombre y una línea de descripción. */
export function ModuleGrid({ links, columns = 3 }: { links: ModuleGridLink[]; columns?: 2 | 3 | 4 }) {
  return (
    <CellGrid as="ul" columns={columns} aria-label="Accesos">
      {links.map(({ to, label, description, icon: Icon }) => (
        <li key={to} className="flex">
          <Cell to={to} className="flex-1 flex-row items-center gap-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
              <span className="truncate text-[13px] text-zinc-500 dark:text-zinc-400">{description}</span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-150 group-hover:translate-x-[3px] group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
            />
          </Cell>
        </li>
      ))}
    </CellGrid>
  );
}
