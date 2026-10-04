import {
  BarChart3,
  Boxes,
  CalendarClock,
  ClipboardList,
  Layers,
  LogOut,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROLE_LABELS, type RoleCode } from '@sgia/types';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/context/auth-context';
import type { WebRoleCode } from '@/features/auth/types/roles';

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
    to: '/prestamos/cola',
    label: 'Cola de préstamos',
    icon: CalendarClock,
    roles: ['PAN-01'],
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

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
  const roleLabel = user?.rol ? ROLE_LABELS[user.rol as RoleCode] : 'Usuario';

  // Filter navigation items based on the user's role
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

  return (
    <div className="flex min-h-screen bg-background text-text">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r border-border bg-surface px-3 py-5">
        <div className="flex flex-col gap-6">
          {/* App Brand Header */}
          <div className="flex items-center gap-2.5 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-raised">
              <Boxes className="h-4 w-4 text-accent" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono-tabular text-sm font-semibold tracking-tight text-text">
                SGIA
              </span>
              <span className="text-[10px] text-text-muted">
                INACAP Sede Temuco
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Navegación principal" className="flex flex-col gap-1">
            {allowedNavItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted',
                    'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    'hover:bg-surface-raised hover:text-text',
                    isActive && 'bg-surface-raised font-medium text-text border border-border',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card & Logout in Footer */}
        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between gap-2 px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised font-mono-tabular text-xs font-semibold text-text">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-medium text-text">
                  {user?.nombre ?? 'Cargando...'}
                </span>
                <span className="truncate text-[11px] text-text-muted">
                  {user?.email ?? ''}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-text-muted transition-colors hover:border-border hover:bg-surface-raised hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between px-2 text-[11px]">
            <span className="text-text-muted">{roleLabel}</span>
            <Badge tone="accent">{userRole}</Badge>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
