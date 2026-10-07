import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Producto } from '@sgia/types';

import { ProductoDetailDialog } from './components/producto-detail-dialog';

const mockProducto: Producto = {
  id: 42,
  codigoBarras: 'SGIA-2026-CISCO',
  barcode: 'SGIA-2026-CISCO',
  nombre: 'Cisco Router 2901',
  categoria: 'Equipos de Red',
  stock: 12,
  stock_minimo: 5,
  stockCritico: 5,
  area: 'Redes',
  activo: true,
  is_active: true,
  ubicacion: {
    id: 3,
    sala: 'Lab Redes 204',
    cajon: 'Rack Principal #2',
    descripcion: 'Equipamiento de switching y routing',
  },
  location: {
    id: 3,
    sala: 'Lab Redes 204',
    cajon: 'Rack Principal #2',
    descripcion: 'Equipamiento de switching y routing',
  },
  createdAt: '2026-09-15T00:00:00Z',
  created_at: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  updated_at: '2026-09-15T00:00:00Z',
};

const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" data-testid="code128-svg"><rect width="10" height="50" fill="black"/></svg>`;

vi.mock('@sgia/api-client', () => ({
  useProductBarcode: () => ({
    data: {
      product_id: 42,
      product_name: 'Cisco Router 2901',
      barcode: 'SGIA-2026-CISCO',
      svg: mockSvg,
      html: `<div>${mockSvg}</div>`,
    },
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

describe('ProductoDetailDialog (REQ-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window.print !== 'function') {
      window.print = vi.fn();
    }
  });

  it('renders product specifications, location and stock status', () => {
    render(<ProductoDetailDialog open={true} onClose={vi.fn()} producto={mockProducto} />);

    expect(screen.getByText('Cisco Router 2901')).toBeDefined();
    expect(screen.getAllByText('SGIA-2026-CISCO').length).toBeGreaterThan(0);
    expect(screen.getByText('Lab Redes 204')).toBeDefined();
    expect(screen.getByText('Rack Principal #2')).toBeDefined();
    expect(screen.getByText('Equipos de Red')).toBeDefined();
    expect(screen.getByText('Normal')).toBeDefined();
  });

  it('renders Code128 barcode container and allows thermal print dispatch', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<ProductoDetailDialog open={true} onClose={vi.fn()} producto={mockProducto} />);

    expect(screen.getByTestId('code128-svg')).toBeDefined();

    const printBtn = screen.getByRole('button', { name: /Imprimir etiqueta térmica/i });
    await userEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('handles reubicar button trigger', async () => {
    const handleReubicar = vi.fn();
    render(
      <ProductoDetailDialog
        open={true}
        onClose={vi.fn()}
        producto={mockProducto}
        onReubicar={handleReubicar}
      />,
    );

    const reubicarBtn = screen.getByRole('button', { name: /Reubicar/i });
    await userEvent.click(reubicarBtn);

    expect(handleReubicar).toHaveBeenCalledWith(mockProducto);
  });
});
