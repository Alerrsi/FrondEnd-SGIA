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
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROLE_LABELS, type RoleCode } from '@sgia/types';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme/theme-toggle';
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

const COLLAPSED_WIDTH = 68;
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 180;
const MAX_WIDTH = 420;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useTheme(); // Inicializa y asegura contexto activo

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

  const currentSidebarWidth = isCollapsed ? COLLAPSED_WIDTH : width;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        {/* Sidebar estructurado con arquitectura de doble tema */}
        <aside
          style={{ width: `${currentSidebarWidth}px` }}
          className={cn(
            'relative flex flex-shrink-0 flex-col justify-between border-r border-zinc-200 dark:border-zinc-800 border-l-0 bg-white dark:bg-zinc-900 py-4 shadow-xs',
            isCollapsed ? 'px-2' : 'px-3',
            !isDragging && 'transition-[width] duration-150 ease-in-out',
          )}
          aria-label="Panel lateral de navegación"
        >
          <div className="flex flex-col gap-4">
            {/* App Brand Header */}
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                  title="SGIA · Pañol Informática INACAP"
                >
                  <Boxes className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(false)}
                  title="Expandir panel lateral"
                  aria-label="Expandir panel lateral"
                  className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
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
            )}

            {/* Navigation Links */}
            <nav
              aria-label="Navegación principal"
              className={cn('flex flex-col', isCollapsed ? 'items-center gap-2' : 'gap-1')}
            >
              {allowedNavItems.map(({ to, label, icon: Icon, end }) => {
                const linkContent = (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={isCollapsed ? undefined : label}
                    aria-label={label}
                    className={({ isActive }) =>
                      isCollapsed
                        ? cn(
                            'flex h-7 w-7 items-center justify-center rounded border transition-colors cursor-pointer',
                            isActive
                              ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200',
                          )
                        : cn(
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
                            isCollapsed ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0',
                            !isCollapsed && (isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'),
                          )}
                        />
                        {!isCollapsed && <span className="truncate">{label}</span>}
                      </>
                    )}
                  </NavLink>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={to}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </nav>
          </div>

          {/* User Profile and Bottom Controls */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {userInitials}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold text-xs">{user?.nombre ?? 'Usuario'}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{roleLabel}</p>
                  </TooltipContent>
                </Tooltip>

                <ThemeToggle variant="compact" />

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
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
                    <ThemeToggle variant="segmented" />
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
            )}
          </div>

          {/* Separador interactivo de redimensionamiento */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Ajustar tamaño de panel lateral"
            tabIndex={0}
            onMouseDown={() => setIsDragging(true)}
            title="Arrastra para cambiar el tamaño del panel lateral"
            className={cn(
              'absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize select-none transition-colors hover:bg-zinc-300/60 dark:hover:bg-zinc-700/60',
              isDragging && 'bg-zinc-400 dark:bg-zinc-500 w-1.5',
            )}
          />
        </aside>

        {/* Contenido principal con Canvas bg-zinc-100 dark:bg-zinc-950 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header Superior con Centro de Notificaciones */}
          <header className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs px-6 sm:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                SISTEMA DE GESTIÓN DE INVENTARIO Y ACTIVOS · PAÑOL TI
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
