import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Boxes,
  CalendarClock,
  ClipboardList,
  Cpu,
  History,
  Layers,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROLE_LABELS, type RoleCode } from '@sgia/types';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle';
import { GlassIconBar } from '@/components/ui/iconbar';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/context/auth-context';
import type { WebRoleCode } from '@/features/auth/types/roles';
import { toast } from '@/lib/toast';
import { NotificationBell } from '@/features/alertas/components/notification-bell';

interface NavItem {
  to: string;
  label: string;
  icon: typeof BarChart3;
  end?: boolean;
  roles: WebRoleCode[];
}

const navigation: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: BarChart3,
    end: true,
    roles: ['DIR-01'],
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: Layers,
    roles: ['PAN-01', 'DIR-01'],
  },
  {
    to: '/equipos',
    label: 'Equipos y Fichas',
    icon: Cpu,
    roles: ['PAN-01', 'DIR-01', 'AD-01'],
  },
  {
    to: '/alertas',
    label: 'Alertas de Stock',
    icon: Bell,
    roles: ['PAN-01', 'DIR-01', 'AD-01'],
  },
  {
    to: '/prestamos/cola',
    label: 'Cola de préstamos',
    icon: CalendarClock,
    roles: ['PAN-01'],
  },
  {
    to: '/prestamos/mostrador',
    label: 'Mesón / Mostrador',
    icon: Layers,
    roles: ['PAN-01'],
  },
  {
    to: '/prestamos/historial',
    label: 'Historial Préstamos',
    icon: History,
    roles: ['PAN-01', 'DIR-01', 'AD-01'],
  },
  {
    to: '/cotizaciones',
    label: 'Cotizaciones',
    icon: ClipboardList,
    roles: ['DIR-01'],
  },
  {
    to: '/usuarios',
    label: 'Usuarios',
    icon: Users,
    roles: ['AD-01'],
  },
];

const COLLAPSED_WIDTH = 64;
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 180;
const MAX_WIDTH = 420;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sgia-sidebar-collapsed') === 'true';
  });

  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem('sgia-sidebar-width');
    return saved ? Number(saved) : DEFAULT_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem('sgia-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (!isCollapsed) {
      localStorage.setItem('sgia-sidebar-width', String(width));
    }
  }, [width, isCollapsed]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth < 120) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  const userRole = (user?.rol as WebRoleCode) ?? 'AD-01';
  const roleLabel = user?.rol
    ? ROLE_LABELS[user.rol as RoleCode] || 'Usuario'
    : 'Usuario';

  const allowedNavItems = navigation.filter((item) =>
    item.roles.includes(userRole),
  );

  const userInitials = user?.nombre
    ? user.nombre
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  const isLight = resolvedTheme === 'light';

  return (
    <TooltipProvider>
      {/* Canvas unificado bg-zinc-50 dark:bg-zinc-950 para que el área de iconbars flote sobre el mismo fondo exacto de la tabla */}
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        {/* Sidebar: En modo comprimido se remueve el fondo de sidebar sólido y queda una columna de 3 iconbars flotantes con la misma anchura unificada */}
        <aside
          style={{ width: `${isCollapsed ? COLLAPSED_WIDTH : width}px` }}
          className={cn(
            'relative flex flex-shrink-0 flex-col justify-between py-4 select-none',
            isCollapsed
              ? 'bg-transparent border-r-0 shadow-none px-1 items-center z-10'
              : 'border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 shadow-xs',
            !isDragging && 'transition-[width] duration-150 ease-in-out',
          )}
          aria-label="Panel lateral de navegación"
        >
          {isCollapsed ? (
            /* Modo Comprimido: 3 IconBars flotantes con EXACTAMENTE la misma anchura (w-[48px]) */
            <>
              {/* IconBar 1: Logo y Botón de Expandir (w-[48px]) */}
              <div className="bar-well w-[48px] flex flex-col items-center gap-1 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="gnav-item flex items-center justify-center cursor-default text-zinc-900 dark:text-zinc-100"
                      title="SGIA · Pañol Informática INACAP"
                      aria-label="SGIA · Pañol Informática INACAP"
                    >
                      <Boxes size={18} strokeWidth={2} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-xs font-semibold">SGIA · Pañol Informática</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsCollapsed(false)}
                      title="Expandir panel lateral"
                      aria-label="Expandir panel lateral"
                      className="gnav-item flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      <PanelLeftOpen size={18} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-xs font-medium">Expandir panel lateral</span>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* IconBar 2: Opciones de navegación autorizadas con indicador elástico (w-[48px]) */}
              <div className="flex justify-center w-full my-auto">
                <GlassIconBar
                  axis="column"
                  items={allowedNavItems.map((item) => ({
                    key: item.to,
                    label: item.label,
                    Icon: item.icon,
                    to: item.to,
                    end: item.end,
                  }))}
                  glyph={18}
                  hug={4}
                  className="w-[48px] flex justify-center"
                />
              </div>

              {/* IconBar 3: Usuario, Botón de Tema (ocultando toggle en encogido) y Cerrar sesión (w-[48px]) */}
              <div className="bar-well w-[48px] flex flex-col items-center gap-1 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="gnav-item flex items-center justify-center font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-default"
                      title={user?.nombre ?? 'Usuario'}
                      aria-label={`Usuario: ${user?.nombre ?? 'Usuario'}`}
                    >
                      {userInitials}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold text-xs">{user?.nombre ?? 'Usuario'}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{roleLabel}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Botón de tema en modo encogido: oculta el toggle y usa un botón con icono adaptativo */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setTheme(isLight ? 'dark' : 'light')}
                      title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                      className="gnav-item flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      {isLight ? (
                        <Moon size={18} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />
                      ) : (
                        <Sun size={18} strokeWidth={2} className="text-amber-400" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-xs font-medium">
                      {isLight ? 'Modo Claro (clic para Oscuro)' : 'Modo Oscuro (clic para Claro)'}
                    </span>
                  </TooltipContent>
                </Tooltip>

                {/* Botón Cerrar Sesión */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Cerrar sesión"
                      aria-label="Cerrar sesión"
                      className="gnav-item flex items-center justify-center text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 cursor-pointer"
                    >
                      <LogOut size={18} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-xs font-medium">Cerrar sesión</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          ) : (
            /* Modo Expandido: Panel completo estándar con marcas, enlaces de texto y perfil */
            <>
              <div className="flex flex-col gap-4">
                {/* Brand Header */}
                <div className="flex items-center justify-between px-1.5">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                      <Boxes className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        SGIA · Pañol
                      </span>
                      <span className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                        INACAP Sede Temuco
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCollapsed(true)}
                    title="Encoger panel lateral"
                    aria-label="Encoger panel lateral"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Lista Completa de Enlaces de Navegación */}
                <nav
                  aria-label="Navegación principal"
                  className="flex flex-col gap-1"
                >
                  {allowedNavItems.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      aria-label={label}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center rounded-md text-xs font-medium gap-2.5 px-2.5 py-1.5 transition-colors duration-150',
                          isActive
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r before:bg-zinc-900 dark:before:bg-zinc-100'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400',
                            )}
                          />
                          <span className="truncate">{label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>

              {/* User Profile and Bottom Controls */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 shadow-xs">
                        {userInitials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                          {user?.nombre ?? 'Usuario'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{roleLabel}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Liquid Toggle con Moon a la izquierda y Sun a la derecha */}
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
                        <Moon
                          className={cn(
                            'h-3 w-3 transition-colors',
                            !isLight ? 'text-indigo-400 font-bold' : 'text-zinc-400 dark:text-zinc-500',
                          )}
                        />
                        <Toggle
                          size="sm"
                          checked={isLight}
                          onCheckedChange={(light) => setTheme(light ? 'light' : 'dark')}
                          aria-label={isLight ? 'Modo Claro activo, cambiar a Oscuro' : 'Modo Oscuro activo, cambiar a Claro'}
                        />
                        <Sun
                          className={cn(
                            'h-3 w-3 transition-colors',
                            isLight ? 'text-amber-500 font-bold' : 'text-zinc-400 dark:text-zinc-500',
                          )}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                        className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Separador redimensionable con cursor col-resize */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Ajustar tamaño de panel lateral"
          onMouseDown={() => setIsDragging(true)}
          className={cn(
            'group relative flex w-1 flex-shrink-0 cursor-col-resize items-center justify-center transition-colors select-none z-20',
            isDragging
              ? 'bg-zinc-400 dark:bg-zinc-600'
              : isCollapsed
                ? 'opacity-0 pointer-events-none'
                : 'hover:bg-zinc-300 dark:hover:bg-zinc-700 bg-transparent',
          )}
        >
          <div className="h-6 w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400 transition-colors" />
        </div>

        {/* Workspace Central */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header / Bar */}
          <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 transition-colors">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Módulo Activo
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Sistema de Pañol y Activos
              </span>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </header>

          {/* Main Content Area: comparte exactamente el mismo canvas bg-zinc-50 dark:bg-zinc-950 */}
          <main className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
