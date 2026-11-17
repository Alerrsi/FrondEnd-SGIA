import { ChevronDown, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InicioModule } from '../lib/inicio-content';

interface InicioHeaderProps {
  modules: InicioModule[];
  panelPath: string;
  onLogout: () => void;
}

/** Barra superior de la portada: marca, módulos del rol, tema, salir e ir al panel. */
export function InicioHeader({ modules, panelPath, onLogout }: InicioHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-3">
      <Link to="/inicio" className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        SGIA<span className="text-amber-400">.</span>
      </Link>

      <nav aria-label="Portada" className="order-3 flex w-full items-center gap-6 text-xs sm:order-none sm:w-auto lg:mr-auto lg:ml-[38%]">
        <a href="#que-es" className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ¿Qué es SGIA?
        </a>
        <Link to={panelPath} className="font-medium text-zinc-900 dark:text-zinc-100">
          Mi panel
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-1 text-zinc-500 outline-none transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Módulos <ChevronDown className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <DropdownMenuItem key={m.to} onSelect={() => navigate(m.to)}>
                  <Icon className="h-3.5 w-3.5" /> {m.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <div className="flex items-center gap-2">
        <ThemeToggle className="lg:text-white/80" />
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-zinc-300 px-4 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 lg:border-white/40 lg:text-white lg:hover:bg-white/10 dark:lg:border-white/30"
        >
          <LogOut className="h-3.5 w-3.5" /> Salir
        </button>
        <Link
          to={panelPath}
          className="inline-flex h-9 items-center rounded-full bg-amber-300 px-5 text-xs font-semibold text-zinc-900 shadow-xs transition-colors hover:bg-amber-200"
        >
          Ir al panel
        </Link>
      </div>
    </header>
  );
}
