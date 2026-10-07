import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sileo';

import AlertasStockPage from '@/features/alertas/pages/alertas-stock-page';
import CotizacionesPage from '@/features/cotizaciones/pages/cotizaciones-page';
import DashboardPage from '@/features/dashboard/pages/dashboard-page';
import ProductosListPage from '@/features/inventario/pages/productos-list-page';
import ColaPrestamosPage from '@/features/prestamos/pages/cola-prestamos-page';
import UsuariosPage from '@/features/usuarios/pages/usuarios-page';
import AppLayout from '@/layouts/app-layout';
import LoginPage from '@/features/auth/pages/login';
import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';
import {
  PublicOnlyRoute,
  RequireAuth,
  RequireRole,
} from '@/features/auth/components/protected-route';
import { getRoleDefaultPath } from '@/features/auth/types/roles';

function RootRoute() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.rol === 'DIR-01') {
    return <DashboardPage />;
  }

  return <Navigate to={getRoleDefaultPath(user.rol)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Public login route */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected routes layout */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<RootRoute />} />

            <Route
              path="/inventario"
              element={
                <RequireRole allowedRoles={['PAN-01', 'DIR-01']}>
                  <ProductosListPage />
                </RequireRole>
              }
            />

            <Route
              path="/alertas"
              element={
                <RequireRole allowedRoles={['PAN-01', 'DIR-01', 'AD-01']}>
                  <AlertasStockPage />
                </RequireRole>
              }
            />

            <Route
              path="/prestamos/cola"
              element={
                <RequireRole allowedRoles={['PAN-01']}>
                  <ColaPrestamosPage />
                </RequireRole>
              }
            />

            <Route
              path="/cotizaciones"
              element={
                <RequireRole allowedRoles={['DIR-01']}>
                  <CotizacionesPage />
                </RequireRole>
              }
            />

            <Route
              path="/usuarios"
              element={
                <RequireRole allowedRoles={['AD-01']}>
                  <UsuariosPage />
                </RequireRole>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
