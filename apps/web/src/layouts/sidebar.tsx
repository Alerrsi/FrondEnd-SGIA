import { useRef } from 'react';
import { Boxes, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Settings, Sun } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import { GlassIconBar } from '@/components/ui/iconbar';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/cn';
import type { NavEntry } from './nav-config';
import { SidebarNavGroup } from './sidebar-nav-group';
import { useScrollFade } from './use-scroll-fade';

export const navLinkClass = (isActive: boolean) =>
  cn(
    // Menú neutro: el activo es la superficie con una barra burdeo de 2px.
    'relative flex shrink-0 items-center rounded-md text-[13px] font-medium gap-2.5 px-2.5 py-2 transition-colors duration-150 pointer-coarse:py-3',
    isActive
      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-r before:bg-accent'
      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100',
  );

export interface SidebarUser {
  nombre: string;
  roleLabel: string;
  initials: string;
}

export interface SidebarProps {
  entries: NavEntry[];
  user: SidebarUser;
  /** Riel de iconos de 64px (solo en el sidebar fijo de escritorio). */
  collapsed?: boolean;
  /** Sin `onCollapse` no se muestra el botón de encoger (cajón móvil). */
  onCollapse?: () => void;
  onExpand?: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

/** Contenido del menú lateral: marca, módulos del rol y bloque de usuario con ajustes, tema y salida. */
export function Sidebar({ entries, user, collapsed = false, onCollapse, onExpand, onOpenSettings, onLogout }: SidebarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const isLight = resolvedTheme === 'light';

  // La lista de módulos ocupa solo el alto libre entre la marca y el usuario; si no cabe, hace scroll.
  const navScrollRef = useRef<HTMLElement>(null);
  const railScrollRef = useRef<HTMLDivElement>(null);
  useScrollFade(navScrollRef, null, [collapsed, pathname, entries.length]);
  useScrollFade(railScrollRef, '.gnav', [collapsed, pathname, entries.length]);

  if (collapsed) {
    return (
      <>
        {/* Marca y botón para desplegar */}
        <div className="bar-well w-[48px] shrink-0 flex flex-col items-center gap-1 p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="gnav-item flex items-center justify-center text-zinc-900 dark:text-zinc-100 cursor-default">
                <Boxes aria-hidden="true" size={20} strokeWidth={2} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs font-medium">SGIA · Pañol</p>
              <p className="text-xs text-zinc-400">INACAP Sede Temuco</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onExpand}
                title="Expandir panel lateral"
                aria-label="Expandir panel lateral"
                className="gnav-item flex items-center justify-center cursor-pointer"
              >
                <PanelLeftOpen aria-hidden="true" size={18} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir menú</TooltipContent>
          </Tooltip>
        </div>

        {/* Módulos: riel vertical de 48px, siempre en columna (regla dura de CLAUDE.md) */}
        <div ref={railScrollRef} className="flex-1 min-h-0 w-full flex flex-col items-center">
          <GlassIconBar
            axis="column"
            items={entries.map(({ to, label, icon: Icon, end }) => ({ key: to, to, Icon, label, end }))}
            glyph={18}
            hug={4}
            className="w-[48px] max-h-full min-h-0 my-auto overflow-hidden flex flex-col items-center justify-start"
          />
        </div>

        {/* Usuario, ajustes, tema y salida */}
        <div data-testid="rail-user-block" className="bar-well w-[48px] shrink-0 flex flex-col items-center gap-1 p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="gnav-item flex items-center justify-center text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-default"
                title={user.nombre}
                aria-label={`Usuario: ${user.nombre}`}
              >
                {user.initials}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs font-medium">{user.nombre}</p>
              <p className="text-xs text-zinc-400">{user.roleLabel}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenSettings}
                title="Ajustes de usuario y apariencia"
                aria-label="Ajustes de usuario y apariencia"
                className="gnav-item flex items-center justify-center cursor-pointer"
              >
                <Settings aria-hidden="true" size={18} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Ajustes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                className="gnav-item flex items-center justify-center cursor-pointer"
              >
                {isLight ? (
                  <Moon aria-hidden="true" size={18} strokeWidth={2} />
                ) : (
                  <Sun aria-hidden="true" size={18} strokeWidth={2} className="text-warn" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{isLight ? 'Modo oscuro' : 'Modo claro'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="gnav-item flex items-center justify-center cursor-pointer hover:!text-danger"
              >
                <LogOut aria-hidden="true" size={18} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar sesión</TooltipContent>
          </Tooltip>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Marca */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-1.5">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5 rounded-md">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
              <Boxes aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-medium tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">SGIA Pañol</span>
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">INACAP Sede Temuco</span>
            </span>
          </NavLink>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title="Encoger panel lateral"
              aria-label="Encoger panel lateral"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
            >
              <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Módulos */}
        <nav ref={navScrollRef} aria-label="Navegación principal" className="sidebar-scroll -mx-1 flex min-h-0 flex-col gap-0.5 px-1">
          {entries.map(({ to, label, icon: Icon, end, children }) =>
            children ? (
              <SidebarNavGroup key={to} to={to} label={label} icon={Icon} links={children} linkClassName={navLinkClass} />
            ) : (
              <NavLink key={to} to={to} end={end} aria-label={label} className={({ isActive }) => navLinkClass(isActive)}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ),
          )}
        </nav>
      </div>

      {/* Usuario, ajustes, salida y tema */}
      <div data-testid="sidebar-user-block" className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 pt-3">
        <div className="flex items-center justify-between gap-1.5 min-w-0 px-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {user.initials}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium leading-tight text-zinc-900 dark:text-zinc-100">{user.nombre}</span>
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.roleLabel}</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={onOpenSettings}
              title="Ajustes de usuario y apariencia"
              aria-label="Ajustes de usuario y apariencia"
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <Settings aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-danger cursor-pointer pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="select-none text-xs text-zinc-500 dark:text-zinc-400">Tema {isLight ? 'claro' : 'oscuro'}</span>
          <Toggle
            size="sm"
            checked={isLight}
            onCheckedChange={(light) => setTheme(light ? 'light' : 'dark')}
            aria-label={isLight ? 'Modo claro activo, cambiar a oscuro' : 'Modo oscuro activo, cambiar a claro'}
          />
        </div>
      </div>
    </>
  );
}
