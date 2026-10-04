import { Boxes, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/auth-context';
import { canAccessRoute, getRoleDefaultPath, type WebRoleCode } from '../types/roles';
import { ForbiddenPage } from './forbidden-page';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex items-center gap-2 mb-4">
        <Boxes className="h-6 w-6 text-accent animate-pulse" />
        <span className="font-mono-tabular text-base font-semibold tracking-tight text-text">
          SGIA
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs font-mono-tabular text-text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
        <span>Verificando sesión...</span>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RequireRole({
  allowedRoles,
  children,
}: {
  allowedRoles: WebRoleCode[];
  children?: ReactNode;
}) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.rol as WebRoleCode)) {
    return <ForbiddenPage />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && user) {
    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
    const destination =
      fromPath && fromPath !== '/login' && canAccessRoute(user.rol, fromPath)
        ? fromPath
        : getRoleDefaultPath(user.rol);

    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}
