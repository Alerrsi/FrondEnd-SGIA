import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Supplier } from '@sgia/types';

import { ProveedoresTable } from './components/proveedores-table';

const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'Distribuidora TechPro Ltda.',
    contact_name: 'Carlos Muñoz',
    email: 'ventas@techpro.cl',
    phone: '+56 9 1234 5678',
    category: 'Redes',
    is_active: true,
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 2,
    name: 'Insumos Digitales SpA',
    contact_name: 'María López',
    email: 'contacto@insumosdigitales.cl',
    phone: '+56 2 9876 5432',
    category: 'Electrónica',
    is_active: true,
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-02-20T00:00:00Z',
  },
  {
    id: 3,
    name: 'Global Supplies Chile',
    contact_name: null,
    email: 'info@globalsupplies.cl',
    phone: null,
    category: null,
    is_active: false,
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
];

describe('ProveedoresTable (REQ-07)', () => {
  it('renders supplier data correctly', () => {
    render(
      <ProveedoresTable
        suppliers={mockSuppliers}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    );

    // Company names
    expect(screen.getByText('Distribuidora TechPro Ltda.')).toBeDefined();
    expect(screen.getByText('Insumos Digitales SpA')).toBeDefined();
    expect(screen.getByText('Global Supplies Chile')).toBeDefined();

    // Contact names
    expect(screen.getByText('Carlos Muñoz')).toBeDefined();
    expect(screen.getByText('María López')).toBeDefined();

    // Emails
    expect(screen.getByText('ventas@techpro.cl')).toBeDefined();
    expect(screen.getByText('contacto@insumosdigitales.cl')).toBeDefined();
    expect(screen.getByText('info@globalsupplies.cl')).toBeDefined();

    // Status badges
    const activeBadges = screen.getAllByText('activo');
    expect(activeBadges.length).toBe(2);
    expect(screen.getByText('suspendido')).toBeDefined();

    // Category badges (might also exist in select filter)
    expect(screen.getAllByText('Redes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Electrónica').length).toBeGreaterThanOrEqual(1);
  });

  it('triggers onEdit callback when clicking edit button', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    render(
      <ProveedoresTable
        suppliers={mockSuppliers}
        onEdit={handleEdit}
        onToggleStatus={vi.fn()}
      />,
    );

    const editButtons = screen.getAllByTitle('Editar proveedor');
    expect(editButtons.length).toBeGreaterThan(0);
    await user.click(editButtons[0]!);

    expect(handleEdit).toHaveBeenCalledWith(mockSuppliers[0]);
  });

  it('shows empty state when no suppliers', () => {
    render(
      <ProveedoresTable
        suppliers={[]}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    );

    expect(screen.getByText(/No se encontraron proveedores/i)).toBeDefined();
  });

  it('shows loading state', () => {
    render(
      <ProveedoresTable
        suppliers={[]}
        isLoading={true}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    );

    expect(screen.getByText(/Cargando catálogo de proveedores/i)).toBeDefined();
  });

  it('handles search input', async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();

    render(
      <ProveedoresTable
        suppliers={mockSuppliers}
        search=""
        onSearchChange={handleSearch}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Buscar proveedor/i);
    await user.type(searchInput, 'TechPro');
    expect(handleSearch).toHaveBeenCalled();
  });
});
