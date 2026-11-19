import { useState } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import { cn } from '@/lib/cn';

interface SidebarNavGroupProps {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Ya filtrados por rol. */
  links: Array<{ to: string; label: string; icon: LucideIcon }>;
  linkClassName: (isActive: boolean) => string;
}

/** Entrada del menú lateral con sus páginas en un desplegable; se abre sola si la ruta actual es suya. */
export function SidebarNavGroup({ to, label, icon: Icon, links, linkClassName }: SidebarNavGroupProps) {
  const { pathname } = useLocation();
  const inGroup = pathname === to || pathname.startsWith(`${to}/`);
  const [open, setOpen] = useState(inGroup);
  const [lastPath, setLastPath] = useState(pathname);
  // Al entrar al grupo desde otra página se despliega (sin efecto: ajuste de estado durante el render).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (inGroup) setOpen(true);
  }
  const listId = `nav-group-${to.replace(/\W/g, '')}`;

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <div className="flex items-center gap-1">
        <NavLink
          to={to}
          end
          aria-label={label}
          className={({ isActive }) => cn(linkClassName(isActive), 'flex-1 min-w-0')}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? `Contraer ${label}` : `Desplegar ${label}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 cursor-pointer"
        >
          <ChevronDown aria-hidden="true" className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div id={listId} className="ml-3 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
          {links.map(({ to: childTo, label: childLabel, icon: ChildIcon }) => (
            <NavLink
              key={childTo}
              to={childTo}
              aria-label={childLabel}
              className={({ isActive }) => linkClassName(isActive)}
            >
              <ChildIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{childLabel}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
