import { ChevronDown } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import type { NavEntry, NavLinkEntry } from './nav-config';

/** Enlaces sueltos visibles en la barra; el resto pasa a «Más». Los grupos (Compras) siempre quedan a la vista. */
const VISIBLE = 5;

const itemClass = (active: boolean) =>
  cn(
    'relative flex h-14 items-center gap-1 px-2.5 text-[13px] font-medium transition-colors duration-150',
    // El actual lleva una barra de 2px bajo la palabra.
    "after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-t after:content-['']",
    active
      ? 'text-zinc-900 dark:text-zinc-100 after:bg-accent'
      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 after:bg-transparent',
  );

function isIn(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function GroupMenu({ label, links, active }: { label: string; links: NavLinkEntry[]; active: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(itemClass(active), 'cursor-pointer data-[state=open]:text-zinc-900 dark:data-[state=open]:text-zinc-100')}>
        {label}
        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={0} className="w-[min(560px,calc(100vw-2rem))] p-2">
        <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
          {links.map(({ to, label: name, description, icon: Icon }) => (
            <DropdownMenuItem key={to} asChild className="items-start gap-3 p-2.5">
              <Link to={to}>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
                  <span className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">{description}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Menú horizontal del layout con header (desde 1024px). Compras y «Más» abren un panel. */
export function HeaderNav({ entries }: { entries: NavEntry[] }) {
  const { pathname } = useLocation();
  // Los grupos no cuentan para el límite ni caen en «Más»: Compras sigue siendo su propio menú.
  const links = entries.filter((e) => !e.children);
  const visibleLinks = new Set(links.slice(0, VISIBLE));
  const visible = entries.filter((e) => e.children || visibleLinks.has(e));
  const overflowLinks: NavLinkEntry[] = links
    .slice(VISIBLE)
    .map(({ to, label, description, icon }) => ({ to, label, description, icon }));

  return (
    <nav aria-label="Navegación principal" className="hidden min-w-0 items-center lg:flex">
      {visible.map((entry) =>
        entry.children ? (
          <GroupMenu key={entry.to} label={entry.label} links={entry.children} active={isIn(pathname, entry.to)} />
        ) : (
          <NavLink key={entry.to} to={entry.to} end={entry.end} className={({ isActive }) => itemClass(isActive)}>
            {entry.label}
          </NavLink>
        ),
      )}
      {overflowLinks.length > 0 && (
        <GroupMenu label="Más" links={overflowLinks} active={overflowLinks.some((l) => isIn(pathname, l.to))} />
      )}
    </nav>
  );
}
