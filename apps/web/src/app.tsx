import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { getStoredToken } from '@/config/api';
import CotizacionesPage from '@/features/cotizaciones/pages/cotizaciones-page';
import DashboardPage from '@/features/dashboard/pages/dashboard-page';
import ProductosListPage from '@/features/inventario/pages/productos-list-page';
import ColaPrestamosPage from '@/features/prestamos/pages/cola-prestamos-page';
import UsuariosPage from '@/features/usuarios/pages/usuarios-page';
import AppLayout from '@/layouts/app-layout';
import LoginPage from '@/features/auth/pages/login';

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getStoredToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventario" element={<ProductosListPage />} />
          <Route path="/prestamos/cola" element={<ColaPrestamosPage />} />
          <Route path="/cotizaciones" element={<CotizacionesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}