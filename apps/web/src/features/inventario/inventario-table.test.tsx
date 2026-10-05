import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Producto } from '@sgia/types';

import { InventarioTable } from './components/inventario-table';

const mockProductos: Producto[] = [
  {
    id: 1,
    nombre: 'Router Cisco ISR 4321',
    name: 'Router Cisco ISR 4321',
    codigoBarras: 'SGIA-CISCO-4321',
    barcode: 'SGIA-CISCO-4321',
    description: 'Enrutador Gigabit modular',
    categoria: 'Redes',
    stock: 2,
    quantity: 2,
    stockCritico: 5, // stock <= stockCritico => CRITICAL
    stock_minimo: 5,
    area: 'Redes',
    activo: true,
    is_active: true,
    ubicacion: { id: 10, sala: 'Lab 201', cajon: 'Rack B' },
    location: { id: 10, sala: 'Lab 201', cajon: 'Rack B' },
    createdAt: '2026-09-01T00:00:00Z',
    created_at: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 2,
    nombre: 'Switch Catalyst 2960',
    name: 'Switch Catalyst 2960',
    codigoBarras: 'SGIA-SW-2960',
    barcode: 'SGIA-SW-2960',
    description: 'Switch 24 puertos PoE',
    categoria: 'Redes',
    stock: 12,
    quantity: 12,
    stockCritico: 4, // Normal
    stock_minimo: 4,
    area: 'Telecomunicaciones',
    activo: false,
    is_active: false,
    ubicacion: { id: 11, sala: 'Pañol 1', cajon: 'Estante 4' },
    location: { id: 11, sala: 'Pañol 1', cajon: 'Estante 4' },
    createdAt: '2026-09-01T00:00:00Z',
    created_at: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

describe('InventarioTable', () => {
  it('renders products and displays critical stock alert badge when stock <= stock_minimo', () => {
    render(
      <InventarioTable
        productos={mockProductos}
        onViewDetail={vi.fn()}
        onEdit={vi.fn()}
        onToggleActivo={vi.fn()}
      />,
    );

    // Product names
    expect(screen.getByText('Router Cisco ISR 4321')).toBeDefined();
    expect(screen.getByText('Switch Catalyst 2960')).toBeDefined();

    // Barcodes
    expect(screen.getByText('SGIA-CISCO-4321')).toBeDefined();
    expect(screen.getByText('SGIA-SW-2960')).toBeDefined();

    // Critical stock badge
    expect(screen.getByText(/Crítico/i)).toBeDefined();

    // Status badges: activo and inactivo
    expect(screen.getByText('activo')).toBeDefined();
    expect(screen.getByText('inactivo')).toBeDefined();
  });

  it('triggers onViewDetail callback when clicking on the barcode action button', async () => {
    const user = userEvent.setup();
    const handleViewDetail = vi.fn();

    render(
      <InventarioTable
        productos={mockProductos}
        onViewDetail={handleViewDetail}
        onEdit={vi.fn()}
        onToggleActivo={vi.fn()}
      />,
    );

    const viewButtons = screen.getAllByTitle(/Ver detalle y código de barras/i);
    expect(viewButtons.length).toBeGreaterThan(0);
    await user.click(viewButtons[0]!);

    expect(handleViewDetail).toHaveBeenCalledWith(mockProductos[0]);
  });

  it('triggers onEdit, onToggleActivo and onDelete callbacks', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    const handleToggle = vi.fn();
    const handleDelete = vi.fn();

    render(
      <InventarioTable
        productos={mockProductos}
        canDelete={true}
        onViewDetail={vi.fn()}
        onEdit={handleEdit}
        onToggleActivo={handleToggle}
        onDelete={handleDelete}
      />,
    );

    // Click edit for product 1
    const editButtons = screen.getAllByTitle(/Editar producto/i);
    await user.click(editButtons[0]!);
    expect(handleEdit).toHaveBeenCalledWith(mockProductos[0]);

    // Click toggle status for product 1
    const toggleButtons = screen.getAllByTitle(/Desactivar producto|Activar producto/i);
    await user.click(toggleButtons[0]!);
    expect(handleToggle).toHaveBeenCalledWith(mockProductos[0]);

    // Click delete
    const deleteButtons = screen.getAllByTitle(/Eliminar producto/i);
    await user.click(deleteButtons[0]!);
    expect(handleDelete).toHaveBeenCalledWith(mockProductos[0]);
  });

  it('handles search input and filter changes', async () => {
    const user = userEvent.setup();
    const handleSearchChange = vi.fn();
    const handleAreaChange = vi.fn();
    const handleCriticalChange = vi.fn();

    render(
      <InventarioTable
        productos={mockProductos}
        search=""
        onSearchChange={handleSearchChange}
        onAreaFilterChange={handleAreaChange}
        onCriticalOnlyChange={handleCriticalChange}
        onViewDetail={vi.fn()}
        onEdit={vi.fn()}
        onToggleActivo={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
    await user.type(searchInput, 'Cisco');
    expect(handleSearchChange).toHaveBeenCalled();

    const criticalCheckbox = screen.getByLabelText(/Solo stock crítico/i);
    await user.click(criticalCheckbox);
    expect(handleCriticalChange).toHaveBeenCalledWith(true);
  });
});
