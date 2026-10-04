import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

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
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111113',
            color: '#f5f5f5',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#111113',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#111113',
            },
          },
        }}
      />
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
            {/* Root route: Dashboard for DIR-01, redirect to default path for others */}
            <Route path="/" element={<RootRoute />} />

            {/* Inventario: PAN-01 & DIR-01 */}
            <Route
              path="/inventario"
              element={
                <RequireRole allowedRoles={['PAN-01', 'DIR-01']}>
                  <ProductosListPage />
                </RequireRole>
              }
            />

            {/* Cola de Préstamos: PAN-01 */}
            <Route
              path="/prestamos/cola"
              element={
                <RequireRole allowedRoles={['PAN-01']}>
                  <ColaPrestamosPage />
                </RequireRole>
              }
            />

            {/* Cotizaciones: DIR-01 */}
            <Route
              path="/cotizaciones"
              element={
                <RequireRole allowedRoles={['DIR-01']}>
                  <CotizacionesPage />
                </RequireRole>
              }
            />

            {/* Usuarios: AD-01 */}
            <Route
              path="/usuarios"
              element={
                <RequireRole allowedRoles={['AD-01']}>
                  <UsuariosPage />
                </RequireRole>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
