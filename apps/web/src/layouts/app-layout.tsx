import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardPlus,
  FileWarning,
  PackageSearch,
  ClipboardList,
  Cpu,
  GraduationCap,
  History,
  Layers,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ScrollText,
  Settings,
  Sun,
  Users,
  Wrench,
  ShoppingCart,
  Wallet,
  Warehouse,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROLE_LABELS, type RoleCode } from '@sgia/types';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle';
import { GlassIconBar } from '@/components/ui/iconbar';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/context/auth-context';
import { ROUTE_PERMISSIONS, type WebRoleCode } from '@/features/auth/types/roles';
import { toast } from '@/lib/toast';
import { NotificationBell } from '@/features/alertas/components/notification-bell';
import { SettingsModal } from '@/components/settings/settings-modal';
import { ChangePasswordDialog } from '@/features/auth/components/change-password-dialog';
import { SessionsDialog } from '@/features/auth/components/sessions-dialog';

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
    label: 'Dashboards',
    icon: BarChart3,
    end: true,
    roles: ROUTE_PERMISSIONS['/'] ?? [],
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: Boxes,
    roles: ROUTE_PERMISSIONS['/inventario'] ?? [],
  },
  {
    to: '/prestamos',
    label: 'Préstamos',
    icon: CalendarClock,
    roles: ROUTE_PERMISSIONS['/prestamos'] ?? [],
  },
  {
    to: '/ubicaciones',
    label: 'Ubicaciones',
    icon: Layers,
    roles: ROUTE_PERMISSIONS['/ubicaciones'] ?? [],
  },
  {
    to: '/equipos',
    label: 'Fichas Técnicas',
    icon: Cpu,
    roles: ROUTE_PERMISSIONS['/equipos'] ?? [],
  },
  {
    to: '/cotizaciones',
    label: 'Cotizaciones',
    icon: ClipboardList,
    roles: ROUTE_PERMISSIONS['/cotizaciones'] ?? [],
  },
  {
    to: '/compras',
    label: 'Compras',
    icon: ShoppingCart,
    roles: ROUTE_PERMISSIONS['/compras'] ?? [],
  },
  {
    to: '/presupuestos',
    label: 'Presupuestos',
    icon: Wallet,
    roles: ROUTE_PERMISSIONS['/presupuestos'] ?? [],
  },
  {
    to: '/ingresos-factura',
    label: 'Ingresos de factura',
    icon: ReceiptText,
    roles: ROUTE_PERMISSIONS['/ingresos-factura'] ?? [],
  },
  {
    to: '/proveedores',
    label: 'Proveedores',
    icon: Building2,
    roles: ROUTE_PERMISSIONS['/proveedores'] ?? [],
  },
  {
    to: '/novedades',
    label: 'Novedades',
    icon: FileWarning,
    roles: ROUTE_PERMISSIONS['/novedades'] ?? [],
  },
  {
    to: '/mantenciones',
    label: 'Mantenciones',
    icon: Wrench,
    roles: ROUTE_PERMISSIONS['/mantenciones'] ?? [],
  },
  {
    to: '/estudiantes',
    label: 'Estudiantes',
    icon: GraduationCap,
    roles: ROUTE_PERMISSIONS['/estudiantes'] ?? [],
  },
  {
    to: '/historial',
    label: 'Historial',
    icon: History,
    roles: ROUTE_PERMISSIONS['/historial'] ?? [],
  },
  {
    to: '/alertas',
    label: 'Stock Crítico',
    icon: Bell,
    roles: ROUTE_PERMISSIONS['/alertas'] ?? [],
  },
  {
    to: '/profesor/catalogo',
    label: 'Catálogo',
    icon: PackageSearch,
    roles: ROUTE_PERMISSIONS['/profesor/catalogo'] ?? [],
  },
  {
    to: '/profesor/solicitudes',
    label: 'Mis solicitudes',
    icon: ClipboardPlus,
    roles: ROUTE_PERMISSIONS['/profesor/solicitudes'] ?? [],
  },
  {
    to: '/profesor/novedades',
    label: 'Novedades',
    icon: FileWarning,
    roles: ROUTE_PERMISSIONS['/profesor/novedades'] ?? [],
  },
  {
    to: '/usuarios',
    label: 'Usuarios',
    icon: Users,
    roles: ROUTE_PERMISSIONS['/usuarios'] ?? [],
  },
  {
    to: '/panoles',
    label: 'Pañoles',
    icon: Warehouse,
    roles: ROUTE_PERMISSIONS['/panoles'] ?? [],
  },
  {
    to: '/auditoria',
    label: 'Auditoría',
    icon: ScrollText,
    roles: ROUTE_PERMISSIONS['/auditoria'] ?? [],
  },
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
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const MIN_WIDTH = 180;
  const MAX_WIDTH = 420;
  const isLight = resolvedTheme === 'light';

  // Manejo de redimensionamiento manual por arrastre
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      requestAnimationFrame(() => {
        const COLLAPSE_THRESHOLD = 130;
        if (e.clientX < COLLAPSE_THRESHOLD) {
          setIsCollapsed(true);
        } else {
          setIsCollapsed(false);
          setSidebarWidth(Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH));
        }
      });
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

  const allowedNavItems = navigation.filter((item) => item.roles.includes(userRole));

  const userInitials = (user?.nombre ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background font-sans text-text antialiased overflow-hidden">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium  focus:shadow-md"
        >
          Saltar al contenido
        </a>
        {/* Barra Lateral / Sidebar */}
        <aside
          style={{ width: isCollapsed ? 64 : sidebarWidth }}
          className={cn(
            'relative flex flex-col justify-between select-none overflow-hidden z-20',
            isDragging ? 'transition-none' : 'transition-[width] duration-200 ease-out',
            isCollapsed
              ? 'py-3 px-2 items-center bg-transparent border-none shadow-none'
              : 'p-3 bg-background border-r border-border',
          )}
        >
          {isCollapsed ? (
            /* Modo Encogido (48px): 3 IconBars compactos según directriz de diseño */
            <>
              {/* IconBar 1: Brand Logo y Botón para desplegar (w-[48px]) */}
              <div className="bar-well w-[48px] flex flex-col items-center gap-1 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="gnav-item flex items-center justify-center text-text cursor-default">
                      <Boxes aria-hidden="true" size={20} strokeWidth={2.2} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold text-xs">SGIA · Pañol</p>
                    <p className="text-xs sede-text text-text-muted">INACAP Sede Temuco</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsCollapsed(false)}
                      title="Expandir panel lateral"
                      aria-label="Expandir panel lateral"
                      className="gnav-item flex items-center justify-center text-text-muted hover:text-text cursor-pointer"
                    >
                      <PanelLeftOpen aria-hidden="true" size={18} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-xs font-medium">Expandir menú</span>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* IconBar 2: Enlaces de Módulos (Navegación Vertical w-[48px], siempre centrado) */}
              <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center justify-center py-2">
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
                  className="w-[48px] flex flex-col items-center justify-center"
                />
              </div>

              {/* IconBar 3: Usuario, Ajustes, Botón de Tema y Cerrar sesión (w-[48px]) */}
              <div className="bar-well w-[48px] flex flex-col items-center gap-1 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="gnav-item flex items-center justify-center font-mono text-xs font-bold text-text cursor-default"
                      title={user?.nombre ?? 'Usuario'}
                      aria-label={`Usuario: ${user?.nombre ?? 'Usuario'}`}
                    >
                      {userInitials}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold text-xs">{user?.nombre ?? 'Usuario'}</p>
                    <p className="text-xs text-text-muted font-mono">{roleLabel}</p>
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
                      className="gnav-item flex items-center justify-center text-text-muted hover:text-text cursor-pointer"
                    >
                      <Settings aria-hidden="true" size={18} strokeWidth={2} />
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
                      className="gnav-item flex items-center justify-center text-text-muted hover:text-text cursor-pointer"
                    >
                      {isLight ? (
                        <Moon aria-hidden="true"
                          size={18}
                          strokeWidth={2}
                          className="text-text-muted"
                        />
                      ) : (
                        <Sun aria-hidden="true" size={18} strokeWidth={2} className="text-amber-400" />
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
                      className="gnav-item flex items-center justify-center text-text-muted hover:text-danger cursor-pointer"
                    >
                      <LogOut aria-hidden="true" size={18} strokeWidth={2} />
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-text">
                      <Boxes aria-hidden="true" className="h-4 w-4 text-text" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-xs font-bold tracking-tight text-text">
                        SGIA · Pañol
                      </span>
                      <span className="truncate text-xs sede-text text-text-muted">
                        INACAP Sede Temuco
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCollapsed(true)}
                    title="Encoger panel lateral"
                    aria-label="Encoger panel lateral"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border text-text-muted transition-colors hover:bg-surface-raised hover:text-text cursor-pointer"
                  >
                    <PanelLeftClose aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Lista Completa de Enlaces de Navegación */}
                <nav aria-label="Navegación principal" className="flex flex-col gap-1">
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
                            ? 'bg-surface-raised text-text border border-border font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r before:bg-ink'
                            : 'text-text-muted hover:bg-surface-raised hover:text-text',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive
                                ? 'text-text'
                                : 'text-text-muted',
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
              <div className="border-t border-border pt-3">
                <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-2.5">
                  {/* Fila Superior: Perfil del Usuario + Botón de Ajustes + Botón Logout */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-surface font-mono text-xs font-semibold text-text shadow-xs">
                        {userInitials}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1 pr-1">
                        <span className="truncate text-xs font-semibold text-text leading-tight">
                          {user?.nombre ?? 'Usuario'}
                        </span>
                        <span className="text-xs font-mono text-text-muted truncate">
                          {roleLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        title="Ajustes de usuario y apariencia"
                        aria-label="Ajustes de usuario y apariencia"
                        className="p-1 shrink-0 rounded text-text-muted hover:bg-surface-raised hover:text-text transition-colors cursor-pointer"
                      >
                        <Settings aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                        className="p-1 shrink-0 rounded text-text-muted hover:bg-surface-raised hover:text-text transition-colors cursor-pointer"
                      >
                        <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fila Inferior: Toggle de Modo Oscuro con etiqueta e iconografía */}
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs font-medium text-text-muted select-none">
                      Tema {isLight ? 'Claro' : 'Oscuro'}
                    </span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-surface/60 shadow-2xs shrink-0">
                      <Moon aria-hidden="true"
                        className={cn(
                          'h-3 w-3 transition-colors',
                          !isLight
                            ? 'text-indigo-400 font-bold'
                            : 'text-text-muted',
                        )}
                      />
                      <Toggle
                        size="sm"
                        checked={isLight}
                        onCheckedChange={(light) => setTheme(light ? 'light' : 'dark')}
                        aria-label={
                          isLight
                            ? 'Modo Claro activo, cambiar a Oscuro'
                            : 'Modo Oscuro activo, cambiar a Claro'
                        }
                      />
                      <Sun aria-hidden="true"
                        className={cn(
                          'h-3 w-3 transition-colors',
                          isLight ? 'text-amber-500 font-bold' : 'text-text-muted',
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
            'relative flex w-1 items-center justify-center hover:bg-surface-raised transition-colors cursor-col-resize z-30 group',
            isDragging && 'bg-text-muted',
            isCollapsed && 'opacity-0 hover:opacity-100',
          )}
        >
          <div className="h-6 w-0.5 rounded-full bg-border group-hover:bg-text-muted transition-colors" />
        </div>

        {/* Workspace Central */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header: Unificado con el mismo color del body (bg-background) sin discrepancias */}
          <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-background px-6 transition-colors">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider sede-text text-text-muted">
                Módulo Activo
              </span>
              <span className="text-text-muted">/</span>
              <span className="text-xs font-semibold text-text">
                Sistema de Pañol y Activos
              </span>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </header>

          {/* Main Content Area: comparte exactamente el mismo canvas bg-background */}
          <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none overflow-auto bg-background p-6 transition-colors">
            <div className="mx-auto max-w-7xl">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>

        {/* Modal de Ajustes del Sistema y Paleta de Colores */}
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onChangePassword={() => {
            setSettingsOpen(false);
            setPasswordOpen(true);
          }}
          onViewSessions={() => {
            setSettingsOpen(false);
            setSessionsOpen(true);
          }}
        />
        <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
        <SessionsDialog open={sessionsOpen} onClose={() => setSessionsOpen(false)} />
      </div>
    </TooltipProvider>
  );
}
