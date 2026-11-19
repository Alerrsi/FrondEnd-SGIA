import { useState } from 'react';
import { Boxes, LogOut, Menu, Settings } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { NotificationBell } from '@/features/alertas/components/notification-bell';
import { ContentFrame } from './content-frame';
import { HeaderNav } from './header-nav';
import { SearchButton } from './search-button';
import { navLinkClass } from './sidebar';
import type { ShellProps } from './sidebar-layout';
import { UserMenu } from './user-menu';

/**
 * Layout con header tradicional: barra fija de 56px con la marca, el menú horizontal (desde 1024px),
 * búsqueda, campana y cuenta. Bajo 1024px el menú se abre a pantalla completa.
 */
export function HeaderLayout({ entries, user, showBell, onSearch, onOpenSettings, onLogout }: ShellProps) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900 dark:focus:bg-zinc-900 dark:focus:text-zinc-100"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto flex h-full max-w-[1280px] items-center gap-4 px-3 sm:px-6 lg:border-x lg:border-zinc-200 lg:px-8 lg:dark:border-zinc-800">
          <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md" aria-label="SGIA Pañol, ir a Inicio">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <Boxes aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-medium tracking-[-0.01em]">SGIA</span>
          </Link>
          <HeaderNav entries={entries} />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <SearchButton onClick={onSearch} />
            {showBell && <NotificationBell />}
            <span className="hidden lg:flex">
              <UserMenu user={user} onOpenSettings={onOpenSettings} onLogout={onLogout} />
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Menú a pantalla completa bajo 1024px */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        {menuOpen && (
          <SheetContent side="right" className="w-full !max-w-none gap-4" aria-describedby={undefined}>
            <SheetTitle>Menú</SheetTitle>
            <nav aria-label="Navegación principal" className="flex flex-col gap-0.5">
              {entries.map((entry) =>
                entry.children ? (
                  <div key={entry.to} className="flex flex-col gap-0.5 pt-2">
                    <p className="px-2.5 pb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{entry.label}</p>
                    {entry.children.map(({ to, label, icon: Icon }) => (
                      <NavLink key={to} to={to} className={({ isActive }) => navLinkClass(isActive)}>
                        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <NavLink key={entry.to} to={entry.to} end={entry.end} className={({ isActive }) => navLinkClass(isActive)}>
                    <entry.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {entry.label}
                  </NavLink>
                ),
              )}
            </nav>
            <div className="mt-auto flex flex-col gap-1 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <p className="px-2.5 text-[13px] font-medium">{user.nombre}</p>
              <p className="px-2.5 pb-1 text-xs text-zinc-500 dark:text-zinc-400">{user.roleLabel}</p>
              <button type="button" onClick={onOpenSettings} className={navLinkClass(false)}>
                <Settings aria-hidden="true" className="h-4 w-4" />
                Ajustes de usuario y apariencia
              </button>
              <button type="button" onClick={onLogout} className={navLinkClass(false)}>
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        <ContentFrame />
      </main>
    </div>
  );
}
