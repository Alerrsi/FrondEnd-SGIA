import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/layouts/app-layout';
import LoginPage from '@/features/auth/pages/login';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { LayoutPreferenceProvider } from '@/contexts/layout-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  PublicOnlyRoute,
  RequireAuth,
  RequireRole,
} from '@/features/auth/components/protected-route';
import { rolesForRoute } from '@/features/auth/types/roles';


/* Cada pantalla se descarga al abrirla (rediseño «Trazo», fase 3): el primer render carga solo login y layout.
   El `Suspense` está en `ContentFrame`, dentro del layout. */
const AlertasStockPage = lazy(() => import('@/features/alertas/pages/alertas-stock-page'));
const ComprasPage = lazy(() => import('@/features/compras/pages/compras-page'));
const ComprasHubPage = lazy(() => import('@/features/compras/pages/compras-hub-page'));
const CompraTrazabilidadPage = lazy(() => import('@/features/compras/pages/compra-trazabilidad-page'));
const CotizacionesPage = lazy(() => import('@/features/cotizaciones/pages/cotizaciones-page'));
const SolicitudesCompraPage = lazy(() => import('@/features/solicitudes-compra/pages/solicitudes-compra-page'));
const SolicitudCompraDetailPage = lazy(() => import('@/features/solicitudes-compra/pages/solicitud-compra-detail-page'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page'));
const AuditoriaPage = lazy(() => import('@/features/administracion/pages/auditoria-page'));
const MonitoreoPage = lazy(() => import('@/features/monitoreo/pages/monitoreo-page'));
const PanolesPage = lazy(() => import('@/features/administracion/pages/panoles-page'));
const MantencionesPage = lazy(() => import('@/features/mantenciones/pages/mantenciones-page'));
const EstudiantesPage = lazy(() => import('@/features/estudiantes/pages/estudiantes-page'));
const EquiposPage = lazy(() => import('@/features/equipos/pages/equipos-page'));
const IngresosFacturaPage = lazy(() => import('@/features/ingresos-factura/pages/ingresos-factura-page'));
const PresupuestosPage = lazy(() => import('@/features/presupuestos/pages/presupuestos-page'));
const ProductosListPage = lazy(() => import('@/features/inventario/pages/productos-list-page'));
const PrestamosMenuPage = lazy(() => import('@/features/prestamos/pages/prestamos-menu-page'));
const ColaPrestamosPage = lazy(() => import('@/features/prestamos/pages/cola-prestamos-page'));
const MostradorPrestamosPage = lazy(() => import('@/features/prestamos/pages/mostrador-prestamos-page'));
const HistorialPrestamosPage = lazy(() => import('@/features/prestamos/pages/historial-prestamos-page'));
const UbicacionesPage = lazy(() => import('@/features/ubicaciones/pages/ubicaciones-page'));
const MapaSalaPage = lazy(() => import('@/features/mapa-salas/pages/mapa-sala-page'));
const MapaSalaIndexRedirect = lazy(() => import('@/features/mapa-salas/pages/mapa-sala-index-redirect'));
const ProveedoresPage = lazy(() => import('@/features/proveedores/pages/proveedores-page'));
const UsuariosPage = lazy(() => import('@/features/usuarios/pages/usuarios-page'));
const CatalogoPage = lazy(() => import('@/features/profesor/pages/catalogo-page'));
const MisSolicitudesPage = lazy(() => import('@/features/profesor/pages/mis-solicitudes-page'));
const NovedadesPage = lazy(() => import('@/features/novedades/pages/novedades-page'));
const MisNovedadesPage = lazy(() => import('@/features/profesor/pages/mis-novedades-page'));
const InicioPage = lazy(() => import('@/features/inicio/pages/inicio-page'));

/** URLs anteriores al módulo Compras (nov 2026) → nuevas; conserva el resto de la ruta y la query. */
const LEGACY_PURCHASE_PATHS: Array<[string, string]> = [
  ['/solicitudes-compra', '/compras/solicitudes'],
  ['/ingresos-factura', '/compras/facturas'],
  ['/presupuestos', '/compras/presupuestos'],
  ['/proveedores', '/compras/proveedores'],
  ['/cotizaciones', '/compras/cotizaciones'],
];

function LegacyRedirect({ from, to }: { from: string; to: string }) {
  const { pathname, search } = useLocation();
  return <Navigate to={to + pathname.slice(from.length) + search} replace />;
}

function AppContent() {
  return (
    <>
      <Toaster />
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
            {/* Inicio de todos los roles: a dónde llega cada usuario al iniciar sesión. */}
            <Route
              path="/"
              element={
                <RequireRole allowedRoles={rolesForRoute('/') ?? []}>
                  <InicioPage />
                </RequireRole>
              }
            />
            {/* Rutas antiguas, por marcadores guardados. */}
            <Route path="/inicio" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Navigate to="/analitica" replace />} />

            <Route
              path="/analitica"
              element={
                <RequireRole allowedRoles={rolesForRoute('/analitica') ?? []}>
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
              path="/mapa-salas"
              element={
                <RequireRole allowedRoles={rolesForRoute('/mapa-salas') ?? []}>
                  <MapaSalaIndexRedirect />
                </RequireRole>
              }
            />

            <Route
              path="/mapa-salas/:locationId"
              element={
                <RequireRole allowedRoles={rolesForRoute('/mapa-salas') ?? []}>
                  <MapaSalaPage />
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
              path="/compras"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras') ?? []}>
                  <ComprasHubPage />
                </RequireRole>
              }
            />

            {LEGACY_PURCHASE_PATHS.map(([from, to]) => (
              <Route key={from} path={`${from}/*`} element={<LegacyRedirect from={from} to={to} />} />
            ))}
            <Route path="/compras/:id/trazabilidad" element={<LegacyRedirect from="/compras" to="/compras/ordenes" />} />

            <Route
              path="/compras/proveedores"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras/proveedores') ?? []}>
                  <ProveedoresPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras/solicitudes"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras/solicitudes') ?? []}>
                  <SolicitudesCompraPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras/solicitudes/:id"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras/solicitudes') ?? []}>
                  <SolicitudCompraDetailPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras/cotizaciones"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras/cotizaciones') ?? []}>
                  <CotizacionesPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras/ordenes"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras/ordenes') ?? []}>
                  <ComprasPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras/ordenes/:id/trazabilidad"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras/ordenes') ?? []}>
                  <CompraTrazabilidadPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras/presupuestos"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras/presupuestos') ?? []}>
                  <PresupuestosPage />
                </RequireRole>
              }
            />

            <Route
              path="/compras/facturas"
              element={
                <RequireRole allowedRoles={rolesForRoute('/compras/facturas') ?? []}>
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
              path="/monitoreo"
              element={
                <RequireRole allowedRoles={rolesForRoute('/monitoreo') ?? []}>
                  <MonitoreoPage />
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
      <LayoutPreferenceProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </LayoutPreferenceProvider>
    </ThemeProvider>
  );
}
