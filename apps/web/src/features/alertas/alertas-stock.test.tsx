import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { CriticalStockAlert, Producto } from '@sgia/types';

import AlertasStockPage from './pages/alertas-stock-page';
import { NotificationBell } from './components/notification-bell';
import { InventarioTable } from '@/features/inventario/components/inventario-table';

const mockCriticalAlert: CriticalStockAlert = {
  id: 101,
  product_id: 1,
  product_name: 'Tester Fluke 115 Multímetro',
  alert_type: 'critical',
  is_resolved: false,
  stock: 2,
  stock_minimo: 5,
  created_at: '2026-10-06T10:00:00Z',
  product: {
    id: 1,
    nombre: 'Tester Fluke 115 Multímetro',
    codigoBarras: 'SGIA-FLUKE-115',
    stock: 2,
    stockCritico: 5,
    stock_minimo: 5,
    categoria: 'Electrónica',
    area: 'Telecomunicaciones',
    activo: true,
    ubicacion: { id: 1, sala: 'Lab 101', cajon: 'Gaveta A1', descripcion: 'Estante 1' },
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
};

const mockWarningAlert: CriticalStockAlert = {
  id: 102,
  product_id: 2,
  product_name: 'Bobina Cable UTP Cat6 305m',
  alert_type: 'warning',
  is_resolved: false,
  stock: 7,
  stock_minimo: 5,
  created_at: '2026-10-06T11:00:00Z',
  product: {
    id: 2,
    nombre: 'Bobina Cable UTP Cat6 305m',
    codigoBarras: 'SGIA-UTP-CAT6',
    stock: 7,
    stockCritico: 5,
    stock_minimo: 5,
    categoria: 'Redes',
    area: 'Informática',
    activo: true,
    ubicacion: { id: 2, sala: 'Pañol Central', cajon: 'Rack B2', descripcion: 'Estante Redes' },
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
};

const mockResolvedAlert: CriticalStockAlert = {
  id: 103,
  product_id: 3,
  product_name: 'Patch Cord 2m RJ45',
  alert_type: 'critical',
  is_resolved: true,
  stock: 12,
  stock_minimo: 10,
  created_at: '2026-10-05T08:00:00Z',
  product: {
    id: 3,
    nombre: 'Patch Cord 2m RJ45',
    codigoBarras: 'SGIA-PATCH-2M',
    stock: 12,
    stockCritico: 10,
    stock_minimo: 10,
    categoria: 'Redes',
    area: 'Informática',
    activo: true,
    ubicacion: { id: 3, sala: 'Pañol Central', cajon: 'Rack B1', descripcion: 'Cables' },
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
};

const mockResolveMutateAsync = vi.fn();

vi.mock('@sgia/api-client', () => ({
  useCriticalStockAlerts: (params?: any) => {
    let data = [mockCriticalAlert, mockWarningAlert];
    if (params?.is_resolved === true) {
      data = [mockResolvedAlert];
    } else if (params?.is_resolved === false) {
      data = [mockCriticalAlert, mockWarningAlert];
    } else if (params?.alert_type === 'critical') {
      data = [mockCriticalAlert];
    } else if (params?.alert_type === 'warning') {
      data = [mockWarningAlert];
    }

    return {
      data: {
        data,
        meta: {
          currentPage: 1,
          lastPage: 1,
          perPage: 10,
          total: data.length,
        },
      },
      isLoading: false,
      isFetching: false,
    };
  },
  useResolveStockAlert: () => ({
    mutateAsync: mockResolveMutateAsync,
    isPending: false,
  }),
  useLocations: () => ({
    data: { data: [] },
    isLoading: false,
  }),
  useCajones: () => ({
    data: { data: [] },
    isLoading: false,
  }),
  useProductBarcode: () => ({
    data: { svg: '<svg></svg>' },
    isLoading: false,
  }),
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('REQ-06: Alertas de Stock Crítico y Preventivo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Indicadores Visuales en Catálogo de Inventario', () => {
    it('muestra badge crítico cuando stock <= stock_minimo y badge advertencia cuando stock <= stock_minimo + 5', () => {
      const productosTest: Producto[] = [
        {
          id: 1,
          nombre: 'Tester Fluke (Crítico)',
          codigoBarras: 'FLUKE-CRIT',
          stock: 2, // 2 <= 5 -> crítico
          stockCritico: 5,
          stock_minimo: 5,
          ubicacion: { id: 1, sala: 'Sala 1', cajon: 'C1' },
          categoria: 'Electrónica',
          activo: true,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 2,
          nombre: 'Cable UTP (Advertencia)',
          codigoBarras: 'CABLE-WARN',
          stock: 8, // 8 > 5 && 8 <= 5 + 5 -> advertencia (stock bajo)
          stockCritico: 5,
          stock_minimo: 5,
          ubicacion: { id: 2, sala: 'Sala 2', cajon: 'C2' },
          categoria: 'Redes',
          activo: true,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 3,
          nombre: 'Conectores RJ45 (Normal)',
          codigoBarras: 'RJ45-NORM',
          stock: 50, // 50 > 10 -> normal
          stockCritico: 5,
          stock_minimo: 5,
          ubicacion: { id: 3, sala: 'Sala 3', cajon: 'C3' },
          categoria: 'Redes',
          activo: true,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
      ];

      render(<InventarioTable productos={productosTest} />);

      // Badge crítico (rojo)
      expect(screen.getByText(/Stock crítico \(2 \/ 5 mín\)/i)).toBeDefined();

      // Badge advertencia (ámbar)
      expect(screen.getByText(/Stock bajo \(8 \/ 5 mín\)/i)).toBeDefined();

      // Producto normal muestra existencias sin alerta
      expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    });
  });

  describe('Centro de Notificaciones en Header (NotificationBell)', () => {
    it('renderiza la campana con el contador flotante de alertas activas y abre menú desplegable', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>,
      );

      // Botón de campana con contador flotante
      const bellButton = screen.getByRole('button', {
        name: /Centro de notificaciones/i,
      });
      expect(bellButton).toBeDefined();

      const badge = screen.getByTestId('notification-badge');
      expect(badge.textContent).toBe('2');

      // Clic para desplegar popover
      await user.click(bellButton);

      // Verifica el menú de notificaciones con alertas
      expect(screen.getByText(/Alertas de Stock/i)).toBeDefined();
      expect(screen.getByText('Tester Fluke 115 Multímetro')).toBeDefined();
      expect(screen.getByText('Bobina Cable UTP Cat6 305m')).toBeDefined();
      expect(screen.getByText('Ver bandeja completa de alertas')).toBeDefined();
    });
  });

  describe('Bandeja Completa de Alertas de Stock (/alertas)', () => {
    it('renderiza cinta métrica, tabla con severidades y permite resolver una alerta', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/alertas']}>
          <AlertasStockPage />
        </MemoryRouter>,
      );

      // Encabezado y micro-etiqueta institucional
      expect(screen.getByText(/SEDE TEMUCO · PAÑOL TI/i)).toBeDefined();
      expect(screen.getByText(/Alertas de Stock Crítico y Preventivo/i)).toBeDefined();

      // Cinta Métrica
      expect(screen.getByText(/Alertas Activas:/i)).toBeDefined();
      expect(screen.getByText(/Nivel Crítico \(≤ mín\):/i)).toBeDefined();
      expect(screen.getByText(/Advertencia \(≤ mín \+ 5\):/i)).toBeDefined();

      // Tabla renderiza productos y severidades
      expect(screen.getByText('Tester Fluke 115 Multímetro')).toBeDefined();
      expect(screen.getByText('Bobina Cable UTP Cat6 305m')).toBeDefined();
      expect(screen.getByText('Crítico')).toBeDefined();
      expect(screen.getByText('Advertencia')).toBeDefined();

      // Botón resolver alerta crítica
      const resolveBtns = screen.getAllByRole('button', { name: /Resolver/i });
      expect(resolveBtns.length).toBeGreaterThan(0);

      // Abrir confirmación de resolución
      await user.click(resolveBtns[0]!);

      expect(screen.getByText('Resolver Alerta de Existencias')).toBeDefined();

      // Confirmar resolución
      mockResolveMutateAsync.mockResolvedValueOnce({
        id: 101,
        is_resolved: true,
      });

      const confirmBtn = screen.getByRole('button', { name: 'Marcar como Resuelta' });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(mockResolveMutateAsync).toHaveBeenCalledWith(101);
      });
    });

    it('permite filtrar por severidad y por estado', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/alertas']}>
          <AlertasStockPage />
        </MemoryRouter>,
      );

      // Selector de severidad
      const severitySelect = screen.getByLabelText('Filtrar por severidad');
      await user.selectOptions(severitySelect, 'critical');

      // Selector de estado
      const statusSelect = screen.getByLabelText('Filtrar por estado');
      await user.selectOptions(statusSelect, 'resolved');

      expect((statusSelect as HTMLSelectElement).value).toBe('resolved');
      expect((severitySelect as HTMLSelectElement).value).toBe('critical');
    });
  });
});
