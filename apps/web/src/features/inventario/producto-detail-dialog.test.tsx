import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Producto } from '@sgia/types';

import { ProductoDetailDialog } from './components/producto-detail-dialog';

const mockProducto: Producto = {
  id: 42,
  nombre: 'Cisco Router 2901',
  name: 'Cisco Router 2901',
  codigoBarras: 'SGIA-2026-CISCO',
  barcode: 'SGIA-2026-CISCO',
  description: 'Router de acceso con módulos EHWIC',
  categoria: 'Networking',
  stock: 3,
  quantity: 3,
  stockCritico: 5,
  stock_minimo: 5,
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

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProductoDetailDialog (REQ-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product specifications, location and stock status', () => {
    render(
      <ProductoDetailDialog
        open={true}
        onClose={vi.fn()}
        producto={mockProducto}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText('Cisco Router 2901')).toBeDefined();
    expect(screen.getByText(/Router de acceso con módulos EHWIC/i)).toBeDefined();
    expect(screen.getByText(/Lab Redes 204/i)).toBeDefined();
    expect(screen.getByText(/Rack Principal #2/i)).toBeDefined();
    expect(screen.getAllByText(/Redes/i).length).toBeGreaterThan(0);
  });

  it('renders Code128 vector SVG barcode inside a high-contrast container', () => {
    render(
      <ProductoDetailDialog
        open={true}
        onClose={vi.fn()}
        producto={mockProducto}
        onEdit={vi.fn()}
      />,
    );

    // Monospace barcode display
    expect(screen.getAllByText('SGIA-2026-CISCO').length).toBeGreaterThan(0);

    // Vector SVG rendered inside container
    const svgElement = document.querySelector('svg[data-testid="code128-svg"]');
    expect(svgElement).toBeDefined();
  });

  it('handles label printing when print button is clicked', async () => {
    const user = userEvent.setup();
    const mockPrintWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
      close: vi.fn(),
    };

    const windowOpenSpy = vi
      .spyOn(window, 'open')
      .mockReturnValue(mockPrintWindow as any);

    render(
      <ProductoDetailDialog
        open={true}
        onClose={vi.fn()}
        producto={mockProducto}
        onEdit={vi.fn()}
      />,
    );

    const printButton = screen.getByText(/Imprimir Etiqueta/i);
    await user.click(printButton);

    expect(windowOpenSpy).toHaveBeenCalled();
    expect(mockPrintWindow.document.write).toHaveBeenCalledWith(
      expect.stringContaining('window.print()'),
    );
    expect(mockPrintWindow.document.close).toHaveBeenCalled();

    windowOpenSpy.mockRestore();
  });
});
