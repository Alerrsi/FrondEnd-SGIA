import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sileo';

import AlertasStockPage from '@/features/alertas/pages/alertas-stock-page';
import ComprasPage from '@/features/compras/pages/compras-page';
import CompraTrazabilidadPage from '@/features/compras/pages/compra-trazabilidad-page';
import CotizacionesPage from '@/features/cotizaciones/pages/cotizaciones-page';
import SolicitudesCompraPage from '@/features/solicitudes-compra/pages/solicitudes-compra-page';
import SolicitudCompraDetailPage from '@/features/solicitudes-compra/pages/solicitud-compra-detail-page';
import DashboardPage from '@/features/dashboard/pages/dashboard-page';
import AuditoriaPage from '@/features/administracion/pages/auditoria-page';
import PanolesPage from '@/features/administracion/pages/panoles-page';
import MantencionesPage from '@/features/mantenciones/pages/mantenciones-page';
import EstudiantesPage from '@/features/estudiantes/pages/estudiantes-page';
import EquiposPage from '@/features/equipos/pages/equipos-page';
import IngresosFacturaPage from '@/features/ingresos-factura/pages/ingresos-factura-page';
import PresupuestosPage from '@/features/presupuestos/pages/presupuestos-page';
import ProductosListPage from '@/features/inventario/pages/productos-list-page';
import PrestamosMenuPage from '@/features/prestamos/pages/prestamos-menu-page';
import ColaPrestamosPage from '@/features/prestamos/pages/cola-prestamos-page';
import MostradorPrestamosPage from '@/features/prestamos/pages/mostrador-prestamos-page';
import HistorialPrestamosPage from '@/features/prestamos/pages/historial-prestamos-page';
import UbicacionesPage from '@/features/ubicaciones/pages/ubicaciones-page';
import ProveedoresPage from '@/features/proveedores/pages/proveedores-page';
import UsuariosPage from '@/features/usuarios/pages/usuarios-page';
import AppLayout from '@/layouts/app-layout';
import LoginPage from '@/features/auth/pages/login';
import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  PublicOnlyRoute,
  RequireAuth,
  RequireRole,
} from '@/features/auth/components/protected-route';
import CatalogoPage from '@/features/profesor/pages/catalogo-page';
import MisSolicitudesPage from '@/features/profesor/pages/mis-solicitudes-page';
import NovedadesPage from '@/features/novedades/pages/novedades-page';
import MisNovedadesPage from '@/features/profesor/pages/mis-novedades-page';
import { getRoleDefaultPath, rolesForRoute } from '@/features/auth/types/roles';

function RootRoute() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.rol === 'DIR-01' || user.rol === 'AD-01') {
    return <DashboardPage />;
  }

  return <Navigate to={getRoleDefaultPath(user.rol)} replace />;
}

function AppContent() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toaster position="top-right" theme={resolvedTheme} />
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
              path="/dashboard"
              element={
                <RequireRole allowedRoles={rolesForRoute('/dashboard') ?? []}>
                  <DashboardPage />
                </RequireRole>
              }
            />

            <Route
              path="/inventario"
              element={
                <RequireRole allowedRoles={rolesForRoute('/inventario') ?? []}>
                  <ProductosListPage />
                </RequireRole>
              }
            />

            <Route
              path="/ubicaciones"
              element={
                <RequireRole allowedRoles={rolesForRoute('/ubicaciones') ?? []}>
                  <UbicacionesPage />
                </RequireRole>
              }
            />

            <Route
              path="/equipos"
              element={
                <RequireRole allowedRoles={rolesForRoute('/equipos') ?? []}>
                  <EquiposPage />
                </RequireRole>
              }
            />

            <Route
              path="/equipos/:id"
              element={
                <RequireRole allowedRoles={rolesForRoute('/equipos') ?? []}>
                  <EquiposPage />
                </RequireRole>
              }
            />

            <Route
              path="/alertas"
              element={
                <RequireRole allowedRoles={rolesForRoute('/alertas') ?? []}>
                  <AlertasStockPage />
                </RequireRole>
              }
            />

            <Route
              path="/prestamos"
              element={
                <RequireRole allowedRoles={rolesForRoute('/prestamos') ?? []}>
                  <PrestamosMenuPage />
                </RequireRole>
              }
            />

            <Route
              path="/prestamos/cola"
              element={
                <RequireRole allowedRoles={rolesForRoute('/prestamos/cola') ?? []}>
                  <ColaPrestamosPage />
                </RequireRole>
              }
            />

            <Route
              path="/prestamos/mostrador"
              element={
                <RequireRole allowedRoles={rolesForRoute('/prestamos/mostrador') ?? []}>
                  <MostradorPrestamosPage />
                </RequireRole>
              }
            />

            <Route
              path="/prestamos/registro-presencial"
              element={<Navigate to="/prestamos/mostrador" replace />}
            />

            <Route
              path="/prestamos/historial"
              element={
                <RequireRole allowedRoles={rolesForRoute('/prestamos/historial') ?? []}>
                  <HistorialPrestamosPage />
                </RequireRole>
              }
            />

            <Route
              path="/historial"
              element={
                <RequireRole allowedRoles={rolesForRoute('/historial') ?? []}>
                  <HistorialPrestamosPage />
                </RequireRole>
              }
            />

            <Route
              path="/proveedores"
              element={
                <RequireRole allowedRoles={rolesForRoute('/proveedores') ?? []}>
                  <ProveedoresPage />
                </RequireRole>
              }
            />

            <Route
              path="/solicitudes-compra"
              element={
                <RequireRole allowedRoles={rolesForRoute('/solicitudes-compra') ?? []}>
                  <SolicitudesCompraPage />
                </RequireRole>
              }
            />

            <Route
              path="/solicitudes-compra/:id"
              element={
                <RequireRole allowedRoles={rolesForRoute('/solicitudes-compra') ?? []}>
                  <SolicitudCompraDetailPage />
                </RequireRole>
              }
            />

            <Route
              path="/cotizaciones"
              element={
                <RequireRole allowedRoles={rolesForRoute('/cotizaciones') ?? []}>
                  <CotizacionesPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras') ?? []}>
                  <ComprasPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras/:id/trazabilidad"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras') ?? []}>
                  <CompraTrazabilidadPage />
                </RequireRole>
              }
            />

            <Route
              path="/presupuestos"
              element={
                <RequireRole allowedRoles={rolesForRoute('/presupuestos') ?? []}>
                  <PresupuestosPage />
                </RequireRole>
              }
            />

            <Route
              path="/ingresos-factura"
              element={
                <RequireRole allowedRoles={rolesForRoute('/ingresos-factura') ?? []}>
                  <IngresosFacturaPage />
                </RequireRole>
              }
            />

            <Route
              path="/profesor/catalogo"
              element={
                <RequireRole allowedRoles={rolesForRoute('/profesor/catalogo') ?? []}>
                  <CatalogoPage />
                </RequireRole>
              }
            />

            <Route
              path="/profesor/solicitudes"
              element={
                <RequireRole allowedRoles={rolesForRoute('/profesor/solicitudes') ?? []}>
                  <MisSolicitudesPage />
                </RequireRole>
              }
            />

            <Route
              path="/profesor/novedades"
              element={
                <RequireRole allowedRoles={rolesForRoute('/profesor/novedades') ?? []}>
                  <MisNovedadesPage />
                </RequireRole>
              }
            />

            <Route
              path="/novedades"
              element={
                <RequireRole allowedRoles={rolesForRoute('/novedades') ?? []}>
                  <NovedadesPage />
                </RequireRole>
              }
            />

            <Route
              path="/mantenciones"
              element={
                <RequireRole allowedRoles={rolesForRoute('/mantenciones') ?? []}>
                  <MantencionesPage />
                </RequireRole>
              }
            />

            <Route
              path="/estudiantes"
              element={
                <RequireRole allowedRoles={rolesForRoute('/estudiantes') ?? []}>
                  <EstudiantesPage />
                </RequireRole>
              }
            />

            <Route
              path="/panoles"
              element={
                <RequireRole allowedRoles={rolesForRoute('/panoles') ?? []}>
                  <PanolesPage />
                </RequireRole>
              }
            />

            <Route
              path="/auditoria"
              element={
                <RequireRole allowedRoles={rolesForRoute('/auditoria') ?? []}>
                  <AuditoriaPage />
                </RequireRole>
              }
            />

            <Route
              path="/usuarios"
              element={
                <RequireRole allowedRoles={rolesForRoute('/usuarios') ?? []}>
                  <UsuariosPage />
                </RequireRole>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
