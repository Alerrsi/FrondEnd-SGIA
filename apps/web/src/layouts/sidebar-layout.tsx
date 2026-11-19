import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { NotificationBell } from '@/features/alertas/components/notification-bell';
import { cn } from '@/lib/cn';
import { Breadcrumbs } from './breadcrumbs';
import { ContentFrame } from './content-frame';
import type { NavEntry } from './nav-config';
import { SearchButton } from './search-button';
import { Sidebar, type SidebarUser } from './sidebar';

export interface ShellProps {
  entries: NavEntry[];
  user: SidebarUser;
  showBell: boolean;
  onSearch: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const COLLAPSE_THRESHOLD = 130;

/**
 * Layout con menú lateral (por defecto). Desde 1024px el sidebar queda fijo: se encoge a un riel de
 * iconos y se redimensiona arrastrando el separador. Bajo 1024px se abre como cajón desde el botón de menú.
 */
export function SidebarLayout({ entries, user, showBell, onSearch, onOpenSettings, onLogout }: ShellProps) {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(256);
  const [isDragging, setIsDragging] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // El cajón se cierra al cambiar de pantalla.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        if (e.clientX < COLLAPSE_THRESHOLD) {
          setIsCollapsed(true);
        } else {
          setIsCollapsed(false);
          setWidth(Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH));
        }
      });
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const sidebarProps = { entries, user, onOpenSettings, onLogout };

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900 dark:focus:bg-zinc-900 dark:focus:text-zinc-100"
      >
        Saltar al contenido
      </a>

      {/* Sidebar fijo (desde 1024px) */}
      <aside
        style={{ width: isCollapsed ? 64 : width }}
        className={cn(
          'app-sidebar relative z-20 hidden select-none flex-col justify-between overflow-hidden lg:flex',
          'bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800',
          isDragging ? 'transition-none' : 'transition-[width] duration-200 ease-out',
          isCollapsed ? 'rail-collapsed items-center gap-2 px-2 py-3' : 'gap-3 p-3',
        )}
      >
        <Sidebar
          {...sidebarProps}
          collapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
        />
      </aside>

      {/* Separador redimensionable */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Ajustar tamaño de panel lateral"
        onMouseDown={() => setIsDragging(true)}
        className={cn(
          'group relative z-30 -ml-1 hidden w-1 cursor-col-resize items-center justify-center transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-700 lg:flex',
          isDragging && 'bg-zinc-400 dark:bg-zinc-600',
          isCollapsed && 'opacity-0 hover:opacity-100',
        )}
      >
        <div className="h-6 w-0.5 rounded-full bg-zinc-300 transition-colors group-hover:bg-zinc-500 dark:bg-zinc-700 dark:group-hover:bg-zinc-400" />
      </div>

      {/* Cajón (bajo 1024px) */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        {drawerOpen && (
          <SheetContent side="left" className="app-sidebar w-[min(320px,100%)] !max-w-[320px] gap-3 bg-zinc-100 p-3 dark:bg-zinc-900" aria-describedby={undefined}>
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <Sidebar {...sidebarProps} />
          </SheetContent>
        )}
      </Sheet>

      {/* Área de trabajo */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={drawerOpen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
            <Breadcrumbs />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SearchButton onClick={onSearch} />
            {showBell && <NotificationBell />}
          </div>
        </header>

        <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col overflow-auto focus:outline-none">
          <ContentFrame />
        </main>
      </div>
    </div>
  );
}
