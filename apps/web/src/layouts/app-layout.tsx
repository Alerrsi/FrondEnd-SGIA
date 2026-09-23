import {
  BarChart3,
  Boxes,
  CalendarClock,
  ClipboardList,
  Layers,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { cn } from '@/lib/cn';

const navigation = [
  { to: '/', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/inventario', label: 'Inventario', icon: Layers },
  { to: '/prestamos/cola', label: 'Cola de préstamos', icon: CalendarClock },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: ClipboardList },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 flex-col border-r border-border bg-surface px-3 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Boxes className="h-5 w-5 text-accent" />
          <span className="font-mono-tabular text-sm tracking-tight text-text">SGIA</span>
        </div>
        <nav aria-label="Navegación principal" className="flex flex-col gap-1">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted',
                  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  isActive && 'bg-surface-raised text-text',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}