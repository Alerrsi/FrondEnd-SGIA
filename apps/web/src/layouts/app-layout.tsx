import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardList,
  Cpu,
  History,
  Layers,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
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
import { SettingsModal } from '@/components/settings/settings-modal';

interface NavItem {
  to: string;
  label: string;
  icon: typeof BarChart3;
  end?: boolean;
  roles: WebRoleCode[];
}

const navigation: NavItem[] = [
  { to: '/', label: 'Dashboards', icon: BarChart3, end: true, roles: ['AD-01', 'DIR-01'] },
  { to: '/inventario', label: 'Inventario', icon: Boxes, roles: ['AD-01', 'DIR-01', 'PAN-01'] },
  { to: '/prestamos', label: 'Préstamos', icon: CalendarClock, roles: ['AD-01', 'PAN-01'] },
  { to: '/ubicaciones', label: 'Ubicaciones', icon: Layers, roles: ['AD-01', 'PAN-01'] },
  { to: '/equipos', label: 'Fichas Técnicas', icon: Cpu, roles: ['AD-01', 'DIR-01'] },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: ClipboardList, roles: ['AD-01', 'DIR-01'] },
  { to: '/proveedores', label: 'Proveedores', icon: Building2, roles: ['AD-01', 'DIR-01', 'PAN-01'] },
  { to: '/historial', label: 'Historial', icon: History, roles: ['AD-01', 'PAN-01'] },
  { to: '/alertas', label: 'Stock Crítico', icon: Bell, roles: ['AD-01', 'DIR-01', 'PAN-01'] },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['AD-01'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Estados de barra lateral
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDragging, setIsDragging] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const MIN_WIDTH = 180;
  const MAX_WIDTH = 420;
  const isLight = resolvedTheme === 'light';

  // Manejo de redimensionamiento manual por arrastre
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada correctamente');
    navigate('/login');
  };

  const userRole = (user?.rol as WebRoleCode) ?? 'PAN-01';
  const roleLabel = ROLE_LABELS[userRole as RoleCode] ?? userRole;

  const allowedNavItems = navigation.filter((item) =>
    item.roles.includes(userRole),
  );

  const userInitials = (user?.nombre ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden">
        {/* Barra Lateral / Sidebar */}
        <aside
          style={{ width: isCollapsed ? 48 : sidebarWidth }}
          className={cn(
            'relative flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-[width] duration-200 select-none overflow-hidden z-20',
            isCollapsed ? 'p-0 items-center' : 'p-3',
          )}
        >
          {isCollapsed ? (
            /* Modo Encogido (48px): 3 IconBars compactos según directriz de diseño */
            <>
              {/* IconBar 1: Brand Logo y Botón para desplegar (w-[48px]) */}
              <div className="bar-well w-[48px] flex flex-col items-center gap-1 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="gnav-item flex items-center justify-center text-zinc-900 dark:text-zinc-100 cursor-default">
                      <Boxes size={20} strokeWidth={2.2} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold text-xs">SGIA · Pañol</p>
                    <p className="text-[10px] text-zinc-400">INACAP Sede Temuco</p>
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
                    <span className="text-xs font-medium">Expandir menú</span>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* IconBar 2: Enlaces de Módulos (Navegación Vertical w-[48px]) */}
              <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center py-2">
                <GlassIconBar
                  axis="column"
                  items={allowedNavItems.map(({ to, label, icon: Icon, end }) => ({
                    key: to,
                    to,
                    Icon,
                    label,
                    end,
                    onClick: () => navigate(to),
                  }))}
                  glyph={18}
                  hug={4}
                  className="w-[48px] flex justify-center"
                />
              </div>

              {/* IconBar 3: Usuario, Ajustes, Botón de Tema y Cerrar sesión (w-[48px]) */}
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

                {/* Botón de Ajustes en modo encogido */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(true)}
                      title="Ajustes de usuario y apariencia"
                      aria-label="Ajustes de usuario y apariencia"
                      className="gnav-item flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      <Settings size={18} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-xs font-medium">Ajustes</span>
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
                <div className="flex flex-col gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-2.5">
                  {/* Fila Superior: Perfil del Usuario + Botón de Ajustes + Botón Logout */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 shadow-xs">
                        {userInitials}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1 pr-1">
                        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                          {user?.nombre ?? 'Usuario'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate">{roleLabel}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        title="Ajustes de usuario y apariencia"
                        aria-label="Ajustes de usuario y apariencia"
                        className="p-1 shrink-0 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                        className="p-1 shrink-0 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fila Inferior: Toggle de Modo Oscuro con etiqueta e iconografía */}
                  <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/80 pt-2">
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 select-none">
                      Tema {isLight ? 'Claro' : 'Oscuro'}
                    </span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs shrink-0">
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
            'relative flex w-1 items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-col-resize z-30 group',
            isDragging && 'bg-zinc-400 dark:bg-zinc-600',
          )}
        >
          <div className="h-6 w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400 transition-colors" />
        </div>

        {/* Workspace Central */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header: Unificado con el mismo color del body (bg-zinc-50 dark:bg-zinc-950) sin discrepancias */}
          <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-6 transition-colors">
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

        {/* Modal de Ajustes del Sistema y Paleta de Colores (REQ-CONFIG) */}
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </TooltipProvider>
  );
}
