import { LogOut, Moon, Settings, Sun } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/theme-context';
import type { SidebarUser } from './sidebar';

export interface UserMenuProps {
  user: SidebarUser;
  onOpenSettings: () => void;
  onLogout: () => void;
}

/** Cuenta en la barra superior (layout con header): nombre, rol, ajustes, tema y salida. */
export function UserMenu({ user, onOpenSettings, onLogout }: UserMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Cuenta de ${user.nombre}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer pointer-coarse:h-11 pointer-coarse:w-11"
        >
          {user.initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-1.5">
          <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{user.nombre}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.roleLabel}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onOpenSettings}>
          <Settings aria-hidden="true" className="h-4 w-4" />
          Ajustes de usuario y apariencia
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme(isLight ? 'dark' : 'light')}>
          {isLight ? <Moon aria-hidden="true" className="h-4 w-4" /> : <Sun aria-hidden="true" className="h-4 w-4" />}
          {isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="text-danger focus:text-danger hover:text-danger">
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
